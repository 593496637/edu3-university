export default function Profile() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">个人中心</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">账户信息</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">钱包地址</label>
              <div className="text-sm text-gray-600 bg-gray-100 p-2 rounded">
                请连接钱包
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">昵称</label>
              <input 
                type="text" 
                placeholder="输入昵称"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">个人简介</label>
              <textarea 
                placeholder="输入个人简介"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600">
              更新资料
            </button>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">我的资产</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">YD代币余额:</span>
              <span className="font-bold">0 YD</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">质押中:</span>
              <span className="font-bold">0 YD</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">待领取收益:</span>
              <span className="font-bold text-green-600">0 YD</span>
            </div>
          </div>
          <h3 className="text-lg font-semibold mt-6 mb-3">已购买课程</h3>
          <div className="text-gray-600 text-sm">
            暂无购买记录
          </div>
        </div>
      </div>
    </div>
  );
}