import './globals.css';
import { UserProvider } from '@/components/UserProvider';
import Navbar from '@/components/Navbar';

export const metadata = {
  title: 'Document Repository',
  description: 'Upload, store and search company documents',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <UserProvider>
          <Navbar />
          <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        </UserProvider>
      </body>
    </html>
  );
}