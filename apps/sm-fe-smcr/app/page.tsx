import { getServerSession } from "@/lib/auth/server";
import { LoginPage } from "@/components/login/login-page";
import { redirect } from "next/navigation";

const Home = async () => {
  const session = await getServerSession();

  if (session) {
    redirect("/dashboard");
  }

  return <LoginPage />;
};

export default Home;
