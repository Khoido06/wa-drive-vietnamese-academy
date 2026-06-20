import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="auth-page">
      <p className="auth-page__hint">
        <strong>Đăng nhập 1 lần</strong> để lưu tiến độ — khi đổi điện thoại, bài đã học vẫn còn.
        Dùng email hoặc Google. Con có thể giúp mẹ tạo tài khoản.
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
