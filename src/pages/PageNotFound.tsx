import { Link, useNavigate } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh bg-gray-50 text-gray-800 p-4">
      
      {/* --- Error Code --- */}
      <h1 className="text-9xl font-extrabold text-gray-600 tracking-wider">
        404
      </h1>
      
      {/* --- Main Message --- */}
      <p className="text-3xl font-semibold mt-4 mb-2">
        Page Not Found
      </p>

      {/* --- Subtitle/Explanation --- */}
      <p className="text-lg text-gray-500 mb-8 max-w-md text-center">
        Oops! We couldn't find the page you were looking for. 
        It might have been moved or deleted.
      </p>

      {/* --- Action Buttons --- */}
      <div className="flex space-x-4">
        
        {/* Button to go back one page in history */}
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-100 transition duration-150"
        >
          &larr; Go Back
        </button>

        {/* Link to the Home page */}
        <Link 
          to="/home" // Adjust this to your application's home route
          className="px-6 py-3 text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-blue-700 transition duration-150 shadow-md flex items-center"
        >
          Go to Home
        </Link>
      </div>

    </div>
  );
};

export default NotFoundPage;