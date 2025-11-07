import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect directly to signin - no welcome page
  redirect('/auth/signin');
}
