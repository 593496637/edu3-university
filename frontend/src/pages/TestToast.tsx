import { useToastContext } from '../context/ToastContext';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

export default function TestToast() {
  const { toast } = useToastContext();

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-white mb-8">Toast 通知测试</h1>
        
        <Card title="Toast 通知组件测试">
          <div className="flex flex-wrap gap-4">
            <Button 
              variant="success" 
              onClick={() => toast.success('这是成功消息！')}
            >
              成功通知
            </Button>
            <Button 
              variant="danger" 
              onClick={() => toast.error('这是错误消息！')}
            >
              错误通知
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => toast.warning('这是警告消息！')}
            >
              警告通知
            </Button>
            <Button 
              variant="primary" 
              onClick={() => toast.info('这是信息消息！')}
            >
              信息通知
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => toast.success('这是一个很长很长很长很长很长很长很长很长的消息，用来测试换行效果', 8000)}
            >
              长消息测试
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}