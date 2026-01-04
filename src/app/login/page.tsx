import LoginClient from "./LoginClient";

type LoginPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  const nextParam = searchParams?.next;
  const nextPath =
    typeof nextParam === "string" && nextParam.length > 0 ? nextParam : "/dashboard";

  return <LoginClient nextPath={nextPath} />;
}

