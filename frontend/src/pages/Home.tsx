import { Link } from "react-router";

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8">Web3 教育平台</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">浏览课程</h2>
          <p className="text-gray-600 mb-4">发现和购买优质的区块链课程</p>
          <Link 
            to="/courses" 
            className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            查看课程
          </Link>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">质押挖矿</h2>
          <p className="text-gray-600 mb-4">质押YD代币获取每日1%收益</p>
          <Link 
            to="/staking" 
            className="inline-block bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            开始质押
          </Link>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">个人中心</h2>
          <p className="text-gray-600 mb-4">管理你的课程和资料</p>
          <Link 
            to="/profile" 
            className="inline-block bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
          >
            我的账户
          </Link>
        </div>
      </div>
    </div>
  );
}