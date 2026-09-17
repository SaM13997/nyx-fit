import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { serverFnFetcher } from "../../node_modules/@tanstack/start-client-core/src/client-rpc/serverFnFetcher.ts";

const origin = "http://localhost:3000";
const assets = new URL("../../dist/server/assets/", import.meta.url);
const functionIds = new Map();

for (const file of await readdir(assets)) {
  if (!file.startsWith("functions-") || !file.endsWith(".js")) continue;
  const source = await readFile(new URL(file, assets), "utf8");
  for (const match of source.matchAll(/const (\w+)_createServerFn_handler = createServerRpc\("([a-f0-9]+)"/g)) {
    functionIds.set(match[1], match[2]);
  }
}

async function rpc(name, method, cookie, data, requestOrigin = origin) {
  const id = functionIds.get(name);
  assert.ok(id, `Missing built RPC: ${name}; run bun run build first`);
  const response = await serverFnFetcher(
    `${origin}/_serverFn/${id}`,
    [{ method, data, headers: { cookie, origin: requestOrigin } }],
    (url, options) => fetch(url, options),
  );
  if (response.error) throw response.error;
  return response.result;
}

async function signup(label) {
  const response = await fetch(`${origin}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify({
      email: `smoke-${label}-${crypto.randomUUID()}@example.com`,
      password: crypto.randomUUID(),
      name: `Local smoke ${label}`,
    }),
  });
  assert.equal(response.status, 200, `Local signup ${label}`);
  const cookie = response.headers.getSetCookie().map((value) => value.split(";")[0]).join("; ");
  assert.ok(cookie, "Signup sets a session cookie");
  return cookie;
}

const first = await signup("first");
const second = await signup("second");

await assert.rejects(() => rpc("startWorkout", "GET", first, {}), undefined, "Mutation RPC must reject GET");
await assert.rejects(() => rpc("startWorkout", "POST", first, {}, "https://other.example"), undefined, "Mutation RPC must reject a foreign Origin");

assert.equal(await rpc("getCurrentProfile", "GET", first), null);
const profile = await rpc("upsertCurrentProfile", "POST", first, {
  updates: { name: "Cloudflare smoke", fitnessLevel: "beginner", weightUnit: "kgs" },
});
assert.equal(profile.name, "Cloudflare smoke");
assert.equal((await rpc("getCurrentProfile", "GET", first)).weightUnit, "kgs");
assert.equal(await rpc("getCurrentProfile", "GET", second), null);

const [workout, duplicate] = await Promise.all([
  rpc("startWorkout", "POST", first, { bodyPartWorkedOut: ["Chest"] }),
  rpc("startWorkout", "POST", first, { bodyPartWorkedOut: ["Chest"] }),
]);
assert.equal(workout.id, duplicate.id, "Concurrent start is idempotent");
assert.equal((await rpc("listWorkouts", "GET", first)).length, 1);
assert.equal(await rpc("getWorkout", "GET", second, { id: workout.id }), null);
assert.deepEqual(await rpc("listWorkouts", "GET", second), []);

const exercises = [{ id: "bench", name: "Bench Press", category: "chest", sets: [{ id: "set-1", weight: 100, reps: 8 }] }];
const saved = await rpc("updateWorkout", "POST", first, {
  id: workout.id, revision: workout.revision, updates: { exercises },
});
assert.equal(saved.ok, true);
assert.equal(saved.workout.revision, workout.revision + 1);
const stale = await rpc("updateWorkout", "POST", first, {
  id: workout.id, revision: workout.revision, updates: { exercises: [] },
});
assert.deepEqual(stale, { ok: false, reason: "conflict" });
assert.equal((await rpc("getWorkout", "GET", first, { id: workout.id })).exercises[0].sets.length, 1);
await assert.rejects(() => rpc("updateWorkout", "POST", second, {
  id: workout.id, revision: saved.workout.revision, updates: { notes: "foreign" },
}), undefined, "A second account cannot edit the workout");

const ended = await rpc("updateWorkout", "POST", first, {
  id: workout.id, revision: saved.workout.revision,
  updates: { isActive: false, endTime: new Date().toISOString(), duration: 600 },
});
assert.equal(ended.ok, true);
assert.equal(await rpc("getActiveWorkout", "GET", first), null);
const summary = await rpc("getWorkoutSummary", "GET", first);
assert.equal(summary.totalWorkouts, 1);
assert.equal(summary.totalSets, 1);
const stats = await rpc("getExerciseStats", "GET", first);
assert.equal(stats[0].maxWeight, 100);
assert.equal(stats[0].totalVolume, 800);

const photo = Uint8Array.from(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a2ioAAAAASUVORK5CYII=", "base64"));
const upload = await fetch(`${origin}/api/images`, {
  method: "POST", headers: { cookie: first, origin, "content-type": "image/png" }, body: photo,
});
assert.equal(upload.status, 200);
const { url } = await upload.json();
assert.ok(typeof url === "string" && url.startsWith("/api/images/"));
const image = await fetch(new URL(url, origin), { headers: { cookie: first } });
assert.equal(image.status, 200);
assert.match(image.headers.get("cache-control"), /no-store/);
assert.equal(image.headers.get("x-content-type-options"), "nosniff");
assert.deepEqual(new Uint8Array(await image.arrayBuffer()), photo);
assert.equal((await fetch(new URL(url, origin), { headers: { cookie: second } })).status, 404);
assert.equal((await fetch(new URL(url, origin))).status, 401);

const invalidImage = await fetch(`${origin}/api/images`, {
  method: "POST", headers: { cookie: first, origin, "content-type": "image/png" }, body: "not a PNG",
});
assert.ok(invalidImage.status >= 400 && invalidImage.status < 500);

const weight = await rpc("logWeight", "POST", first, {
  date: new Date().toISOString(), weight: 180, note: "temporary note", photoUrl: url,
});
const cleared = await rpc("updateWeight", "POST", first, { id: weight.id, note: "" });
assert.ok(!cleared.note, "Empty note clears a saved note");
await assert.rejects(() => rpc("deleteWeight", "POST", second, { id: weight.id }), undefined, "A second account cannot delete a weight entry");
await assert.rejects(() => rpc("logWeight", "POST", second, {
  date: new Date().toISOString(), weight: 180, photoUrl: url,
}), undefined, "A second account cannot attach a private image");
assert.equal((await rpc("getWeights", "GET", first, {})).length, 1);
assert.deepEqual(await rpc("getWeights", "GET", second, {}), []);
await rpc("deleteWeight", "POST", first, { id: weight.id });
assert.deepEqual(await rpc("getWeights", "GET", first, {}), []);
await assert.rejects(() => rpc("listWorkouts", "GET", ""), undefined, "Anonymous RPC requires authentication");

console.log("PASS: local D1 auth/profile/workout/CAS/stats/weight flows and private R2 ownership/upload checks");
