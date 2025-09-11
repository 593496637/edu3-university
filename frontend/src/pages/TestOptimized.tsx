import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useToastContext } from '../context/ToastContext';

export default function TestOptimized() {
  const { toast } = useToastContext();
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-white mb-8">优化后的组件测试</h1>
        
        {/* Buttons */}
        <Card title="按钮组件">
          <div className="flex flex-wrap gap-4">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="success">Success</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="primary" loading>Loading</Button>
            <Button variant="primary" icon="🚀">With Icon</Button>
          </div>
        </Card>

        {/* Badges */}
        <Card title="标签组件">
          <div className="flex flex-wrap gap-4">
            <Badge variant="primary">Primary</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="danger">Danger</Badge>
          </div>
        </Card>

        {/* Loading Spinners */}
        <Card title="加载组件">
          <div className="flex flex-wrap gap-6 items-end">
            <LoadingSpinner size="sm" text="Small" />
            <LoadingSpinner size="md" text="Medium" />
            <LoadingSpinner size="lg" text="Large" />
            <LoadingSpinner color="green" text="Green" />
            <LoadingSpinner color="purple" text="Purple" />
          </div>
        </Card>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="简单卡片">
            <p className="text-gray-300">这是一个简单的卡片内容。</p>
          </Card>
          
          <Card hover clickable onClick={() => toast.info('卡片被点击!')}>
            <h3 className="text-lg font-semibold text-white mb-2">可点击卡片</h3>
            <p className="text-gray-400">这个卡片可以点击，鼠标悬停会有效果。</p>
          </Card>
        </div>
      </div>
    </div>
  );
}