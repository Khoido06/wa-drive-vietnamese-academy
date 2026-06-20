import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="auth-page">
      <p className="auth-page__hint">
        Tạo tài khoản để lưu tiến độ học. Mẹ có thể bỏ qua và dùng app không cần đăng ký.
      </p>
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        forceRedirectUrl="/"
      />
    </main>
  );
}
