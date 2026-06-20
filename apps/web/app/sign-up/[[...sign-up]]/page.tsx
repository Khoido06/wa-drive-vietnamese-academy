import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="auth-page">
      <p className="auth-page__hint">
        Tạo tài khoản để <strong>lưu tiến độ</strong> khi đổi điện thoại. Nhập email hoặc dùng Google.
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
