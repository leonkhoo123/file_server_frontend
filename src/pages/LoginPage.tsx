import { useState } from 'react';
import { Button } from '@/components/ui/button'; // shadcn/ui Button
import { Input } from '@/components/ui/input';   // shadcn/ui Input
import { Label } from '@/components/ui/label';   // shadcn/ui Label
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'; // shadcn/ui Card components
import { login } from '@/api/api-auth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import VersionTag from '@/components/custom/versionTag';
import DefaultLayout from '@/layouts/DefaultLayout';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // ✅ Don't forget this important step!
    try {
      await login(username, password);
      toast.success("Welcome");
      navigate("/home")
    } catch (err) {
      // 💡 Add your actual login logic here
      toast.error("Something Went Wrong");
      console.log(err)
    }

  };

  return (
    <DefaultLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex justify-center items-center p-4">

        {/* The max-w-md and w-full make the card responsive:
        - On mobile/small screens, it takes the full width (w-full).
        - On larger screens (iPad/PC), it caps its width at 'md' (28rem) for better readability.
      */}
        <Card className="w-full max-w-md shadow-xl transition-all duration-300">

          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold tracking-tight">
              Login
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* --- Username Input --- */}
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Username"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              {/* --- Password Input --- */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {/* --- Submit Button --- */}
              <Button type="submit" className="w-full">
                Sign In
              </Button>

            </form>
          </CardContent>
          <VersionTag />
        </Card>

      </div>
    </DefaultLayout>

  );
};

export default LoginPage;