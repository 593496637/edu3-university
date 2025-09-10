import { useState } from 'react';

interface CourseChapter {
  id: string;
  title: string;
  content: string;
  videoUrl?: string;
  isPublished: boolean;
}

interface CourseManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: {
    id: number;
    title: string;
    description: string;
    instructor: string;
  } | null;
}

export default function CourseManagementModal({ isOpen, onClose, course }: CourseManagementModalProps) {
  const [chapters, setChapters] = useState<CourseChapter[]>([
    {
      id: '1',
      title: '第一章：基础概念',
      content: '这里是课程的基础概念介绍...',
      videoUrl: '',
      isPublished: true
    }
  ]);
  const [selectedChapter, setSelectedChapter] = useState<CourseChapter | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const addNewChapter = () => {
    const newChapter: CourseChapter = {
      id: Date.now().toString(),
      title: `第${chapters.length + 1}章：新章节`,
      content: '',
      videoUrl: '',
      isPublished: false
    };
    setChapters([...chapters, newChapter]);
    setSelectedChapter(newChapter);
    setIsEditing(true);
  };

  const saveChapter = () => {
    if (selectedChapter) {
      setChapters(chapters.map(ch => 
        ch.id === selectedChapter.id ? selectedChapter : ch
      ));
      setIsEditing(false);
    }
  };

  const deleteChapter = (chapterId: string) => {
    if (window.confirm('确定要删除这个章节吗？')) {
      setChapters(chapters.filter(ch => ch.id !== chapterId));
      if (selectedChapter?.id === chapterId) {
        setSelectedChapter(null);
      }
    }
  };

  const toggleChapterPublish = (chapterId: string) => {
    setChapters(chapters.map(ch => 
      ch.id === chapterId ? { ...ch, isPublished: !ch.isPublished } : ch
    ));
  };

  if (!isOpen || !course) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-700/50 rounded-2xl max-w-6xl w-full h-[90vh] flex overflow-hidden">
        
        {/* 左侧：章节列表 */}
        <div className="w-1/3 border-r border-gray-700/50 flex flex-col">
          <div className="p-6 border-b border-gray-700/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">课程管理</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors text-2xl"
              >
                ×
              </button>
            </div>
            <h3 className="text-lg text-cyan-400 mb-2">{course.title}</h3>
            <p className="text-gray-400 text-sm">{course.description}</p>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-white font-medium">课程章节</h4>
              <button
                onClick={addNewChapter}
                className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1 rounded-md text-sm transition-colors"
              >
                + 添加章节
              </button>
            </div>
            
            <div className="space-y-2">
              {chapters.map((chapter, index) => (
                <div
                  key={chapter.id}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    selectedChapter?.id === chapter.id
                      ? 'bg-cyan-500/20 border-cyan-500/50'
                      : 'bg-gray-700/30 border-gray-600/50 hover:border-gray-500'
                  }`}
                  onClick={() => setSelectedChapter(chapter)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm font-medium">{chapter.title}</span>
                        <div className={`w-2 h-2 rounded-full ${
                          chapter.isPublished ? 'bg-green-400' : 'bg-gray-400'
                        }`}></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleChapterPublish(chapter.id);
                        }}
                        className={`px-2 py-1 rounded text-xs transition-colors ${
                          chapter.isPublished
                            ? 'bg-green-600 text-white hover:bg-green-500'
                            : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                        }`}
                      >
                        {chapter.isPublished ? '已发布' : '草稿'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteChapter(chapter.id);
                        }}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 右侧：章节编辑 */}
        <div className="flex-1 flex flex-col">
          {selectedChapter ? (
            <>
              <div className="p-6 border-b border-gray-700/50">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">编辑章节</h3>
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={saveChapter}
                          className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          保存
                        </button>
                        <button
                          onClick={() => setIsEditing(false)}
                          className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          取消
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        编辑
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex-1 p-6 overflow-y-auto">
                {isEditing ? (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        章节标题
                      </label>
                      <input
                        type="text"
                        value={selectedChapter.title}
                        onChange={(e) => setSelectedChapter({
                          ...selectedChapter,
                          title: e.target.value
                        })}
                        className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50"
                        placeholder="输入章节标题"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        视频链接 (可选)
                      </label>
                      <input
                        type="url"
                        value={selectedChapter.videoUrl || ''}
                        onChange={(e) => setSelectedChapter({
                          ...selectedChapter,
                          videoUrl: e.target.value
                        })}
                        className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50"
                        placeholder="https://..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        章节内容
                      </label>
                      <textarea
                        value={selectedChapter.content}
                        onChange={(e) => setSelectedChapter({
                          ...selectedChapter,
                          content: e.target.value
                        })}
                        rows={12}
                        className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 resize-none"
                        placeholder="输入章节内容..."
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xl font-semibold text-white mb-4">{selectedChapter.title}</h4>
                      
                      {selectedChapter.videoUrl && (
                        <div className="mb-6">
                          <h5 className="text-gray-300 font-medium mb-2">视频内容</h5>
                          <div className="bg-gray-700/30 rounded-lg p-4">
                            <a 
                              href={selectedChapter.videoUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-cyan-400 hover:text-cyan-300 transition-colors"
                            >
                              {selectedChapter.videoUrl}
                            </a>
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <h5 className="text-gray-300 font-medium mb-2">文字内容</h5>
                        <div className="bg-gray-700/20 rounded-lg p-4">
                          <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                            {selectedChapter.content || '暂无内容'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-gray-400 mb-4">选择一个章节开始编辑</div>
                <div className="text-gray-500 text-sm">或者点击"添加章节"创建新内容</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}