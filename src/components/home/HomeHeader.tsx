import type { Profile } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
interface HomeHeaderProps {
  userName: string;
  profilePicture?: string;
}

export function HomeHeader({ userName, profilePicture }: HomeHeaderProps) {
  return (
    <div className="flex items-center justify-between ">
      <div>
        <h1 className="text-2xl font-bold">Hey, <span className="">{userName.split(" ")[0]}</span>!</h1>
        <p className="text-gray-400 text-sm">Ready to crush your workout?</p>
      </div>
      <Avatar>
        <AvatarImage src={profilePicture} />
        <AvatarFallback>
          <span className="text-white">{userName.split(" ")[0][0]}</span>
        </AvatarFallback>
      </Avatar>
    </div>
  );
}

