import { redirect } from 'next/navigation';

export default function StudentProjectsAuthCallbackPage() {
  // The backend already set the `auth_token` HttpOnly cookie.
  // We just need to redirect the user back to the projects page so the
  // RequireGithubWrapper and StudentProjectsPage can re-fetch the `/linked-accounts`
  // API and update the UI state.
  redirect('/student/projects');
}
