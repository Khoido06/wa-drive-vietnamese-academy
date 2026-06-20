import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="auth-page">
      <p className="auth-page__hint">
        Đăng nhập để đồng bộ tiến độ giữa các thiết bị. <strong>Mẹ không bắt buộc đăng nhập</strong> — có thể
        quay lại trang chủ và học bình thường.
      </p>
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        forceRedirectUrl="/"
      />
    </main>
  );
}
