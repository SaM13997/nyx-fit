import { UserButton } from "@/components/UserButton";
interface HomeHeaderProps {
  userName: string;
  profilePicture?: string;
  email?: string;
}

export function HomeHeader({ userName, profilePicture, email }: HomeHeaderProps) {
  const firstName = userName?.trim().split(/\s+/)[0] || "there";
  return (
    <div className="flex items-center justify-between ">
      <div>
        <h1 className="text-2xl font-bold">
          Hey, <span className="">{firstName}</span>!
        </h1>
        <p className="text-gray-400 text-sm">Ready to crush your workout?</p>
      </div>
      <UserButton name={userName} email={email} image={profilePicture} />
    </div>
  );
}

