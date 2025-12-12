"use client";

// import authClient from "@/lib/auth-client";
import { TopBarUser, TopBarUserSignOut } from "@/components/layout/top-bar";
import { useRouter } from "next/navigation";

type Props = {
  name: string;
  email: string;
};

export default function TopBarUserWrapper({ name, email }: Props) {
  const router = useRouter();

  return (
    <TopBarUser name={name} email={email}>
      <button
      // onClick={async () =>
      //   await authClient.signOut({
      //     fetchOptions: {
      //       onSuccess: () => {
      //         router.push("/"); // redirect to login page
      //       },
      //     },
      //   })
      // }
      >
        <TopBarUserSignOut />
      </button>
    </TopBarUser>
  );
}
