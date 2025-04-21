// app/reset-password/[token]/page.tsx
import ResetPasswordPage from '../page';

export default function Page({ params }: { params: { token: string } }) {
  return <ResetPasswordPage params={params} />;
}