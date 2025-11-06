import { CircleCheck, CircleX } from 'lucide-react';
import { Toaster, type ToasterProps } from 'sonner';
// You might need to adjust the path to import Lucide icons if you're using them
// For this example, we'll use simple wrappers with emojis for clarity.

// --- 1. Custom Icon Wrappers for Color ---

// Success Icon styled with 'text-primary' from your shadcn/ui theme
const SuccessIcon = () => (
    <span className="text-green-500">
        <CircleCheck/>
    </span>
);

// Error Icon styled with a standard Tailwind red color
const ErrorIcon = () => (
    <span className="text-red-500">
        <CircleX />
    </span>
);

// --- 2. The Custom Toaster Component ---

// Note: We use ToasterProps if you want to pass additional props from App.tsx
export const SonnerToastCustom = (props: ToasterProps) => {
  return (
    <Toaster 
      // 1. Positioning and Offset
      position="bottom-center" 
      offset={100} // Pushes the toast bar 30px up from the bottom edge
      duration = {2500}
      // 2. Custom Icons for Coloring
      icons={{
        success: <SuccessIcon />,
        error: <ErrorIcon />,
      }}
      
      // 3. Global Toast Styling
      toastOptions={{
        // Common styles for all toast cards (makes them wider, larger padding/font)
        className: 'p-4 rounded-lg shadow-xl w-80 text-lg',
        // style: { 
        //     zIndex: 30, // Ensures toasts are always on top
        // },
      }}
      
      // 4. Spread any additional props passed from the parent (like theme, invert, etc.)
      {...props}
    />
  );
};