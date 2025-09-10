export default function Profile() {
  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            个人中心
          </h1>
          <p className="text-gray-300 text-xl">
            管理您的账户信息和学习进度
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Account Info Card */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 p-8 rounded-2xl">
            <div className="flex items-center mb-8">
              <div className="w-3 h-3 bg-purple-400 rounded-full mr-3 animate-pulse"></div>
              <h2 className="text-2xl font-semibold text-white">账户信息</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">钱包地址</label>
                <div className="p-4 bg-gray-700/50 border border-gray-600/50 rounded-xl text-gray-400 font-mono text-sm">
                  请连接钱包
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">昵称</label>
                <input 
                  type="text" 
                  placeholder="输入昵称"
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">个人简介</label>
                <textarea 
                  placeholder="输入个人简介"
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200 resize-none"
                />
              </div>
              
              <button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-6 rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all duration-300 shadow-lg hover:shadow-purple-500/25 font-semibold">
                更新资料
              </button>
            </div>
          </div>

          {/* Assets Card */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 p-8 rounded-2xl">
            <div className="flex items-center mb-8">
              <div className="w-3 h-3 bg-cyan-400 rounded-full mr-3 animate-pulse"></div>
              <h2 className="text-2xl font-semibold text-white">我的资产</h2>
            </div>
            
            <div className="space-y-6 mb-8">
              <div className="flex justify-between items-center p-4 bg-gray-700/30 rounded-xl">
                <span className="text-gray-300">YD代币余额</span>
                <span className="font-bold text-2xl bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                  0 YD
                </span>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-gray-700/30 rounded-xl">
                <span className="text-gray-300">质押中</span>
                <span className="font-bold text-xl text-green-400">
                  0 YD
                </span>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-gray-700/30 rounded-xl">
                <span className="text-gray-300">待领取收益</span>
                <span className="font-bold text-xl text-blue-400">
                  0 YD
                </span>
              </div>
            </div>

            {/* Learning Progress */}
            <div>
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <span className="w-2 h-2 bg-pink-400 rounded-full mr-3"></span>
                学习进度
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                  <span className="text-gray-300 text-sm">已完成课程</span>
                  <span className="text-pink-400 font-semibold">0 门</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                  <span className="text-gray-300 text-sm">学习时长</span>
                  <span className="text-cyan-400 font-semibold">0 小时</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Purchased Courses */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 p-8 rounded-2xl">
          <div className="flex items-center mb-8">
            <div className="w-3 h-3 bg-blue-400 rounded-full mr-3 animate-pulse"></div>
            <h2 className="text-2xl font-semibold text-white">已购买课程</h2>
          </div>
          
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-gray-500">📚</span>
            </div>
            <p className="text-gray-400">暂无购买记录</p>
            <p className="text-gray-500 text-sm mt-2">购买课程后将在这里显示</p>
          </div>
        </div>
      </div>
    </div>
  );
}