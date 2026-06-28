import { UserButton } from "@/components/UserButton";

interface HomeHeaderProps {
  userName: string;
  profilePicture?: string;
  email?: string;
}

export function HomeHeader({ userName, profilePicture, email }: HomeHeaderProps) {
  const firstName = userName?.trim().split(/\s+/)[0] || "Athlete";

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-bold break-words">
          Hey, <span>{firstName}</span>!
        </h1>
        <p className="text-gray-400 text-sm break-words">
          Ready to crush your workout?
        </p>
      </div>
      <UserButton
        name={userName}
        email={email}
        image={profilePicture}
        className="shrink-0"
      />
    </div>
  );
}
