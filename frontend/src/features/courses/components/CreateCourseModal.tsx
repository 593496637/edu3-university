import { useState } from 'react';
import { useAuthStore } from '@store/authStore';
import { courseService } from '@services/courseService';
import Modal from '@components/ui/Modal';
import Button from '@components/ui/Button';

interface CreateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateCourseModal({ isOpen, onClose, onSuccess }: CreateCourseModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'Web3',
    coverImageUrl: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { isConnected, account } = useAuthStore();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = '课程标题不能为空';
    } else if (formData.title.length > 100) {
      newErrors.title = '课程标题不能超过100个字符';
    }

    if (!formData.description.trim()) {
      newErrors.description = '课程描述不能为空';
    } else if (formData.description.length > 500) {
      newErrors.description = '课程描述不能超过500个字符';
    }

    if (!formData.price.trim()) {
      newErrors.price = '课程价格不能为空';
    } else {
      const price = parseFloat(formData.price);
      if (isNaN(price) || price <= 0) {
        newErrors.price = '请输入有效的价格';
      } else if (price > 10000) {
        newErrors.price = '价格不能超过10000 YD';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected || !account) {
      alert('请先连接钱包');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await courseService.createCourse(
        formData.title,
        formData.description,
        formData.price,
        account,
        {
          category: formData.category,
          coverImageUrl: formData.coverImageUrl || undefined,
        }
      );

      if (result.courseId) {
        alert(`课程创建成功！课程ID: ${result.courseId}`);
        
        // 重置表单
        setFormData({
          title: '',
          description: '',
          price: '',
          category: 'Web3',
          coverImageUrl: '',
        });
        setErrors({});
        
        onSuccess();
        onClose();
      }
    } catch (error: unknown) {
      console.error('创建课程失败:', error);
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      
      if (errorMessage.includes('insufficient funds') || errorMessage.includes('gas')) {
        alert('创建失败：ETH 余额不足，无法支付 gas 费用\n\n请确保您的钱包中有足够的 ETH 来支付交易费用。');
      } else {
        alert(`创建失败: ${errorMessage}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="创建新课程">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 课程标题 */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            课程标题 *
          </label>
          <input
            type="text"
            placeholder="输入课程标题"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            disabled={isSubmitting}
            className={`w-full px-4 py-3 bg-gray-700/50 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200 disabled:opacity-50 ${
              errors.title 
                ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50' 
                : 'border-gray-600/50 focus:ring-purple-500/50 focus:border-purple-500/50'
            }`}
          />
          {errors.title && <p className="mt-1 text-red-400 text-sm">{errors.title}</p>}
        </div>

        {/* 课程描述 */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            课程描述 *
          </label>
          <textarea
            rows={4}
            placeholder="详细描述您的课程内容和学习目标"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            disabled={isSubmitting}
            className={`w-full px-4 py-3 bg-gray-700/50 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200 resize-none disabled:opacity-50 ${
              errors.description
                ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50'
                : 'border-gray-600/50 focus:ring-purple-500/50 focus:border-purple-500/50'
            }`}
          />
          {errors.description && <p className="mt-1 text-red-400 text-sm">{errors.description}</p>}
        </div>

        {/* 课程价格 */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            课程价格 (YD) *
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.price}
              onChange={(e) => handleInputChange('price', e.target.value)}
              disabled={isSubmitting}
              className={`w-full px-4 py-3 pr-12 bg-gray-700/50 border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-200 disabled:opacity-50 ${
                errors.price
                  ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50'
                  : 'border-gray-600/50 focus:ring-purple-500/50 focus:border-purple-500/50'
              }`}
            />
            <div className="absolute right-4 top-3.5 text-gray-400">YD</div>
          </div>
          {errors.price && <p className="mt-1 text-red-400 text-sm">{errors.price}</p>}
        </div>

        {/* 课程分类 */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            课程分类
          </label>
          <select
            value={formData.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
            disabled={isSubmitting}
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 disabled:opacity-50"
          >
            <option value="Web3">Web3</option>
            <option value="DeFi">DeFi</option>
            <option value="NFT">NFT</option>
            <option value="Smart Contracts">Smart Contracts</option>
            <option value="Programming">Programming</option>
            <option value="Trading">Trading</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* 封面图片 */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            封面图片 URL (可选)
          </label>
          <input
            type="url"
            placeholder="https://example.com/image.jpg"
            value={formData.coverImageUrl}
            onChange={(e) => handleInputChange('coverImageUrl', e.target.value)}
            disabled={isSubmitting}
            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 disabled:opacity-50"
          />
        </div>

        {/* 提交按钮 */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1"
          >
            取消
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting || !isConnected}
            className="flex-1"
          >
            {isSubmitting ? '创建中...' : '创建课程'}
          </Button>
        </div>

        {/* 提示信息 */}
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <p className="text-blue-300 text-sm font-medium mb-1">💡 创建须知</p>
          <ul className="text-gray-400 text-sm space-y-1 list-disc list-inside">
            <li>课程创建需要消耗少量 ETH 作为 Gas 费</li>
            <li>课程信息将永久记录在区块链上</li>
            <li>创建后课程信息无法修改，请仔细确认</li>
          </ul>
        </div>
      </form>
    </Modal>
  );
}