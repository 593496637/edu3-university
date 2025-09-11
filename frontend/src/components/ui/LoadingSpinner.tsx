interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'green' | 'purple' | 'white';
  text?: string;
  className?: string;
}

export default function LoadingSpinner({ 
  size = 'md', 
  color = 'blue', 
  text,
  className = '' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const colorClasses = {
    blue: 'border-blue-400/30 border-t-blue-400',
    green: 'border-green-400/30 border-t-green-400',
    purple: 'border-purple-400/30 border-t-purple-400',
    white: 'border-white/30 border-t-white'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div 
        className={`${sizeClasses[size]} ${colorClasses[color]} border-2 rounded-full animate-spin`}
      />
      {text && (
        <p className="text-gray-400 text-sm mt-2">{text}</p>
      )}
    </div>
  );
}