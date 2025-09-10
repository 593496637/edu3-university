import { useState } from 'react';
import { useWalletContext } from '../context/WalletContext';
import { useContracts } from '../../hooks/useContracts';

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
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { isConnected, account } = useWalletContext();
  const { courseOperations, tokenOperations, loading } = useContracts();

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

    if (!isConnected) {
      alert('请先连接钱包');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await courseOperations.createCourse(
        formData.title.trim(),
        formData.description.trim(),
        formData.price
      );

      // 发放创建课程奖励
      const CREATION_REWARD = 100; // 100 YD 代币奖励
      let rewardMessage = '';
      
      try {
        // 检查当前用户是否是owner
        const ownerAddress = await tokenOperations.getOwner();
        if (account?.toLowerCase() === ownerAddress.toLowerCase()) {
          // 如果是owner，直接为创建者mint奖励代币
          const rewardTx = await tokenOperations.mint(account, CREATION_REWARD.toString());
          rewardMessage = `\n🎉 创建课程奖励: ${CREATION_REWARD} YD 代币\n奖励交易: ${rewardTx}`;
        } else {
          // 如果不是owner，提示需要手动发放奖励
          rewardMessage = `\n💡 提示: 创建者将获得 ${CREATION_REWARD} YD 代币奖励\n请联系管理员发放奖励`;
        }
      } catch (rewardError) {
        console.error('发放奖励失败:', rewardError);
        rewardMessage = `\n⚠️ 奖励发放失败，请联系管理员`;
      }

      alert(`课程创建成功！\n课程ID: ${result.courseId}\n交易哈希: ${result.txHash}${rewardMessage}`);
      
      // 重置表单
      setFormData({ title: '', description: '', price: '' });
      setErrors({});
      
      // 通知父组件刷新课程列表
      onSuccess();
      onClose();
    } catch (error) {
      console.error('创建课程失败:', error);
      alert('创建课程失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除该字段的错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900/95 backdrop-blur-md border border-gray-700/50 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            创建新课程
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white w-8 h-8 rounded-full hover:bg-gray-700/50 flex items-center justify-center transition-all duration-200"
            disabled={isSubmitting}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
              课程标题 *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={`w-full px-4 py-3 bg-gray-800/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-200 ${
                errors.title ? 'border-red-500/70' : 'border-gray-600/50'
              }`}
              placeholder="输入课程标题"
              disabled={isSubmitting}
            />
            {errors.title && (
              <p className="text-red-400 text-sm mt-2 flex items-center">
                <span className="w-1 h-1 bg-red-400 rounded-full mr-2"></span>
                {errors.title}
              </p>
            )}
          </div>

          <div className="mb-5">
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
              课程描述 *
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className={`w-full px-4 py-3 bg-gray-800/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-200 resize-none ${
                errors.description ? 'border-red-500/70' : 'border-gray-600/50'
              }`}
              placeholder="输入课程描述"
              disabled={isSubmitting}
            />
            {errors.description && (
              <p className="text-red-400 text-sm mt-2 flex items-center">
                <span className="w-1 h-1 bg-red-400 rounded-full mr-2"></span>
                {errors.description}
              </p>
            )}
          </div>

          <div className="mb-8">
            <label htmlFor="price" className="block text-sm font-medium text-gray-300 mb-2">
              课程价格 (YD) *
            </label>
            <div className="relative">
              <input
                type="number"
                id="price"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                step="0.01"
                min="0"
                className={`w-full px-4 py-3 pr-12 bg-gray-800/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-200 ${
                  errors.price ? 'border-red-500/70' : 'border-gray-600/50'
                }`}
                placeholder="输入价格"
                disabled={isSubmitting}
              />
              <div className="absolute right-4 top-3 text-gray-400 text-sm">YD</div>
            </div>
            {errors.price && (
              <p className="text-red-400 text-sm mt-2 flex items-center">
                <span className="w-1 h-1 bg-red-400 rounded-full mr-2"></span>
                {errors.price}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 text-gray-300 bg-gray-700/50 border border-gray-600/50 rounded-lg hover:bg-gray-600/50 hover:text-white transition-all duration-200 disabled:opacity-50"
              disabled={isSubmitting}
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-cyan-500/25"
              disabled={isSubmitting || loading || !isConnected}
            >
              {isSubmitting || loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  创建中...
                </div>
              ) : (
                '创建课程'
              )}
            </button>
          </div>
        </form>

        {!isConnected && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-center text-red-400 text-sm flex items-center justify-center">
              <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
              请先连接钱包才能创建课程
            </p>
          </div>
        )}
      </div>
    </div>
  );
}