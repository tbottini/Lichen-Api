module.exports = {
  // "reporters": [
  // 	"default",
  // 	[
  // 		"jest-html-reporters",
  // 		{
  // 			"publicPath": "./log/",
  // 			"filename": "report.html",
  // 			"expand": true
  // 		}
  // 	]
  // ],
  testEnvironment: 'node',
  preset: 'ts-jest',
  coveragePathIgnorePatterns: ['/node_modules/'],
}
