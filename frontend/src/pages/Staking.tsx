export default function Staking() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">YD代币质押</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">质押信息</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">APY年化收益率:</span>
              <span className="font-bold text-green-600">365%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">每日收益率:</span>
              <span className="font-bold text-green-600">1%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">当前质押金额:</span>
              <span className="font-bold">0 YD</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">待领取收益:</span>
              <span className="font-bold text-blue-600">0 YD</span>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">质押操作</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                质押数量 (YD)
              </label>
              <input 
                type="number" 
                placeholder="输入质押数量"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600">
              质押代币
            </button>
            <button className="w-full bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600">
              取消质押
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}