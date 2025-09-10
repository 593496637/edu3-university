export default function Staking() {
  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent">
            YD代币质押
          </h1>
          <p className="text-gray-300 text-xl">
            质押您的YD代币，获得丰厚的每日收益
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 p-6 rounded-2xl text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">365%</div>
            <div className="text-gray-400">APY年化收益率</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 p-6 rounded-2xl text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">1%</div>
            <div className="text-gray-400">每日收益率</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 p-6 rounded-2xl text-center">
            <div className="text-3xl font-bold text-cyan-400 mb-2">500K</div>
            <div className="text-gray-400">总质押量 YD</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 p-6 rounded-2xl text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">1.2K</div>
            <div className="text-gray-400">质押用户数</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Staking Info Card */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 p-8 rounded-2xl">
            <div className="flex items-center mb-6">
              <div className="w-3 h-3 bg-green-400 rounded-full mr-3 animate-pulse"></div>
              <h2 className="text-2xl font-semibold text-white">我的质押信息</h2>
            </div>
            
            <div className="space-y-6">
              <div className="flex justify-between items-center p-4 bg-gray-700/30 rounded-xl">
                <span className="text-gray-300">当前质押金额</span>
                <span className="font-bold text-2xl bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent">
                  0 YD
                </span>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-gray-700/30 rounded-xl">
                <span className="text-gray-300">待领取收益</span>
                <span className="font-bold text-2xl bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  0 YD
                </span>
              </div>
              
              <div className="flex justify-between items-center p-4 bg-gray-700/30 rounded-xl">
                <span className="text-gray-300">累计已获得收益</span>
                <span className="font-bold text-xl text-purple-400">
                  0 YD
                </span>
              </div>

              <button className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-4 px-6 rounded-xl hover:from-blue-500 hover:to-cyan-500 transition-all duration-300 shadow-lg hover:shadow-blue-500/25 font-semibold">
                领取收益
              </button>
            </div>
          </div>

          {/* Staking Actions Card */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 p-8 rounded-2xl">
            <div className="flex items-center mb-6">
              <div className="w-3 h-3 bg-cyan-400 rounded-full mr-3 animate-pulse"></div>
              <h2 className="text-2xl font-semibold text-white">质押操作</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  质押数量 (YD)
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    placeholder="输入质押数量"
                    className="w-full px-4 py-4 pr-16 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-200"
                  />
                  <div className="absolute right-4 top-4 text-gray-400">YD</div>
                </div>
              </div>

              <div className="space-y-4">
                <button className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-4 px-6 rounded-xl hover:from-green-500 hover:to-teal-500 transition-all duration-300 shadow-lg hover:shadow-green-500/25 font-semibold">
                  质押代币
                </button>
                
                <button className="w-full bg-gradient-to-r from-red-600 to-pink-600 text-white py-4 px-6 rounded-xl hover:from-red-500 hover:to-pink-500 transition-all duration-300 shadow-lg hover:shadow-red-500/25 font-semibold">
                  取消质押
                </button>
              </div>

              {/* Info Note */}
              <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-3 mt-2"></div>
                  <div>
                    <p className="text-blue-300 text-sm font-medium mb-1">质押说明</p>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      质押后每日可获得1%收益，收益每天自动计算，可随时领取。取消质押无锁定期，随时可以解除。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}