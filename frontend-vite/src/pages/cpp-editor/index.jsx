import { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Space, Tabs, message, Modal, Input, Dropdown, Tooltip, Select, Tag, Spin } from 'antd';
import {
  PlayCircleOutlined, StopOutlined, SaveOutlined, CloudOutlined,
  FolderOpenOutlined, PlusOutlined, DeleteOutlined, EditOutlined,
  CopyOutlined, ClearOutlined, FormatPainterOutlined, DownloadOutlined,
  LoadingOutlined, SnippetsOutlined, WarningOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
  createCodeExecution, getCodeExecutions, getCodeExecution,
  executeCode, deleteCodeExecution, getCodeExecutionStats,
  getProjects, createProject, updateProject, deleteProject
} from '../../services/api';
import { cpp } from '@codemirror/lang-cpp';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';

const { TextArea } = Input;
const { TabPane } = Tabs;

// ============================================================================
// C++ Code Templates
// ============================================================================
export const cppTemplates = {
  default: {
    name: '默认模板',
    description: '基础 C++ 程序',
    category: '基础',
    code: `// C++ 编辑器
// 在这里编写你的 C++ 代码

#include <iostream>
#include <vector>
#include <string>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;

    // 尝试一些基本操作
    vector<int> numbers = {1, 2, 3, 4, 5};
    cout << "数组: ";
    for (int n : numbers) {
        cout << n << " ";
    }
    cout << endl;

    int sum = 0;
    for (int n : numbers) {
        sum += n;
    }
    cout << "总和: " << sum << endl;

    return 0;
}`
  },
  algorithm: {
    name: '算法模板',
    description: '常用算法实现',
    category: '算法',
    code: `// C++ 算法模板
#include <iostream>
#include <vector>
#include <algorithm>
#include <climits>
using namespace std;

// 排序算法 - 快速排序
void quickSort(vector<int>& arr, int left, int right) {
    if (left >= right) return;
    int pivot = arr[(left + right) / 2];
    int i = left, j = right;
    while (i <= j) {
        while (arr[i] < pivot) i++;
        while (arr[j] > pivot) j--;
        if (i <= j) {
            swap(arr[i], arr[j]);
            i++;
            j--;
        }
    }
    if (left < j) quickSort(arr, left, j);
    if (i < right) quickSort(arr, i, right);
}

// 二分查找
int binarySearch(const vector<int>& arr, int target) {
    int left = 0, right = arr.size() - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (arr[mid] == target) return mid;
        else if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}

int main() {
    vector<int> numbers = {64, 34, 25, 12, 22, 11, 90};
    cout << "原始数组: ";
    for (int n : numbers) cout << n << " ";
    cout << endl;

    quickSort(numbers, 0, numbers.size() - 1);
    cout << "排序后: ";
    for (int n : numbers) cout << n << " ";
    cout << endl;

    int target = 25;
    int result = binarySearch(numbers, target);
    cout << "查找 " << target << ": " << (result >= 0 ? "找到" : "未找到") << endl;

    return 0;
}`
  },
  datastructure: {
    name: '数据结构模板',
    description: '栈、队列、链表等',
    category: '数据结构',
    code: `// C++ 数据结构模板
#include <iostream>
#include <vector>
#include <stack>
#include <queue>
#include <string>
using namespace std;

// 栈的应用 - 括号匹配
bool isValidParentheses(const string& s) {
    stack<char> st;
    for (char c : s) {
        if (c == '(' || c == '[' || c == '{') {
            st.push(c);
        } else {
            if (st.empty()) return false;
            char top = st.top();
            if ((c == ')' && top != '(') ||
                (c == ']' && top != '[') ||
                (c == '}' && top != '{')) {
                return false;
            }
            st.pop();
        }
    }
    return st.empty();
}

// 链表节点
struct ListNode {
    int val;
    ListNode* next;
    ListNode(int x) : val(x), next(NULL) {}
};

// 反转链表
ListNode* reverseList(ListNode* head) {
    ListNode* prev = NULL;
    ListNode* curr = head;
    while (curr) {
        ListNode* next = curr->next;
        curr->next = prev;
        prev = curr;
        curr = next;
    }
    return prev;
}

int main() {
    // 测试括号匹配
    string s = "{[()]}";
    cout << "括号 " << s << " 是否匹配: " << (isValidParentheses(s) ? "是" : "否") << endl;

    // 测试链表
    ListNode* head = new ListNode(1);
    head->next = new ListNode(2);
    head->next->next = new ListNode(3);
    head->next->next->next = new ListNode(4);
    head->next->next->next->next = new ListNode(5);

    cout << "原始链表: ";
    for (ListNode* p = head; p; p = p->next) cout << p->val << " ";
    cout << endl;

    head = reverseList(head);
    cout << "反转后: ";
    for (ListNode* p = head; p; p = p->next) cout << p->val << " ";
    cout << endl;

    return 0;
}`
  },
  oop: {
    name: '面向对象模板',
    description: '类和继承示例',
    category: 'OOP',
    code: `// C++ 面向对象编程模板
#include <iostream>
#include <string>
#include <vector>
using namespace std;

// 基类
class Animal {
protected:
    string name;
    int age;
public:
    Animal(const string& n, int a) : name(n), age(a) {}
    virtual ~Animal() {}
    virtual void speak() const = 0;
    virtual void showInfo() const {
        cout << name << ", 年龄: " << age << endl;
    }
};

// 派生类 - 狗
class Dog : public Animal {
private:
    string breed;
public:
    Dog(const string& n, int a, const string& b) : Animal(n, a), breed(b) {}
    void speak() const override {
        cout << name << " 叫: 汪汪汪!" << endl;
    }
    void showInfo() const override {
        cout << "【狗】";
        Animal::showInfo();
        cout << " 品种: " << breed << endl;
    }
};

// 派生类 - 猫
class Cat : public Animal {
private:
    bool indoor;
public:
    Cat(const string& n, int a, bool ind) : Animal(n, a), indoor(ind) {}
    void speak() const override {
        cout << name << " 叫: 喵喵喵!" << endl;
    }
    void showInfo() const override {
        cout << "【猫】";
        Animal::showInfo();
        cout << " 室内猫: " << (indoor ? "是" : "否") << endl;
    }
};

int main() {
    vector<Animal*> animals;
    animals.push_back(new Dog("旺财", 3, "金毛"));
    animals.push_back(new Cat("咪咪", 2, true));
    animals.push_back(new Dog("大黄", 5, "中华田园犬"));

    cout << "=== 动物信息 ===" << endl;
    for (const auto& animal : animals) {
        animal->showInfo();
        animal->speak();
        cout << endl;
    }

    // 清理内存
    for (auto& animal : animals) {
        delete animal;
    }

    return 0;
}`
  },
  stl: {
    name: 'STL 容器模板',
    description: 'vector, map, set 等',
    category: 'STL',
    code: `// C++ STL 容器模板
#include <iostream>
#include <vector>
#include <map>
#include <set>
#include <algorithm>
#include <numeric>
using namespace std;

// 自定义排序
struct Student {
    string name;
    int score;
    Student(string n, int s) : name(n), score(s) {}
};

int main() {
    // vector 使用
    cout << "=== Vector 示例 ===" << endl;
    vector<int> vec = {5, 2, 8, 1, 9};
    cout << "原始: ";
    for (int v : vec) cout << v << " ";
    cout << endl;

    sort(vec.begin(), vec.end());
    cout << "排序后: ";
    for (int v : vec) cout << v << " ";
    cout << endl;

    int sum = accumulate(vec.begin(), vec.end(), 0);
    cout << "元素和: " << sum << endl;

    // map 使用
    cout << "\n=== Map 示例 ===" << endl;
    map<string, int> scores;
    scores["Alice"] = 95;
    scores["Bob"] = 87;
    scores["Charlie"] = 92;

    for (const auto& p : scores) {
        cout << p.first << ": " << p.second << endl;
    }

    // set 使用
    cout << "\n=== Set 示例 ===" << endl;
    set<int> uniqueNums = {1, 2, 2, 3, 3, 3, 4, 4, 4, 4};
    cout << "去重后的元素: ";
    for (int n : uniqueNums) cout << n << " ";
    cout << endl;

    return 0;
}`
  },
  recursion: {
    name: '递归模板',
    description: '递归算法示例',
    category: '算法',
    code: `// C++ 递归算法模板
#include <iostream>
#include <vector>
using namespace std;

// 计算斐波那契数列
long long fibonacci(int n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

// 递归实现排列
void permute(vector<int>& nums, int left, int right) {
    if (left == right) {
        for (int n : nums) cout << n << " ";
        cout << endl;
        return;
    }
    for (int i = left; i <= right; i++) {
        swap(nums[left], nums[i]);
        permute(nums, left + 1, right);
        swap(nums[left], nums[i]);
    }
}

// 递归二分查找
int recursiveBinarySearch(const vector<int>& arr, int target, int left, int right) {
    if (left > right) return -1;
    int mid = left + (right - left) / 2;
    if (arr[mid] == target) return mid;
    if (arr[mid] > target) return recursiveBinarySearch(arr, target, left, mid - 1);
    return recursiveBinarySearch(arr, target, mid + 1, right);
}

// 汉诺塔
void hanoi(int n, char from, char to, char aux) {
    if (n == 1) {
        cout << "移动盘子 1 从 " << from << " 到 " << to << endl;
        return;
    }
    hanoi(n - 1, from, aux, to);
    cout << "移动盘子 " << n << " 从 " << from << " 到 " << to << endl;
    hanoi(n - 1, aux, to, from);
}

int main() {
    cout << "=== 斐波那契数列 ===" << endl;
    for (int i = 0; i < 10; i++) {
        cout << "fib(" << i << ") = " << fibonacci(i) << endl;
    }

    cout << "\n=== 全排列 ===" << endl;
    vector<int> nums = {1, 2, 3};
    permute(nums, 0, nums.size() - 1);

    cout << "\n=== 递归二分查找 ===" << endl;
    vector<int> arr = {1, 3, 5, 7, 9, 11, 13};
    cout << "查找 7: 位置 " << recursiveBinarySearch(arr, 7, 0, arr.size() - 1) << endl;

    cout << "\n=== 汉诺塔 (3层) ===" << endl;
    hanoi(3, 'A', 'C', 'B');

    return 0;
}`
  },
  dynamicProgramming: {
    name: '动态规划模板',
    description: 'DP 问题通用解法',
    category: '算法',
    code: `// C++ 动态规划模板
#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

// 爬楼梯问题
int climbStairs(int n) {
    if (n <= 2) return n;
    vector<int> dp(n + 1, 0);
    dp[1] = 1;
    dp[2] = 2;
    for (int i = 3; i <= n; i++) {
        dp[i] = dp[i - 1] + dp[i - 2];
    }
    return dp[n];
}

// 背包问题
int knapsack(int W, const vector<int>& weights, const vector<int>& values, int n) {
    vector<vector<int>> dp(n + 1, vector<int>(W + 1, 0));
    for (int i = 1; i <= n; i++) {
        for (int w = 0; w <= W; w++) {
            if (weights[i - 1] <= w) {
                dp[i][w] = max(dp[i - 1][w], dp[i - 1][w - weights[i - 1]] + values[i - 1]);
            } else {
                dp[i][w] = dp[i - 1][w];
            }
        }
    }
    return dp[n][W];
}

// 最长公共子序列
int lcs(const string& s1, const string& s2) {
    int m = s1.size(), n = s2.size();
    vector<vector<int>> dp(m + 1, vector<int>(n + 1, 0));
    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (s1[i - 1] == s2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }
    return dp[m][n];
}

int main() {
    cout << "=== 爬楼梯 ===" << endl;
    for (int i = 1; i <= 10; i++) {
        cout << "台阶 " << i << ": " << climbStairs(i) << " 种方法" << endl;
    }

    cout << "\n=== 0-1 背包问题 ===" << endl;
    vector<int> weights = {2, 3, 4, 5};
    vector<int> values = {3, 4, 5, 6};
    int W = 5;
    cout << "最大价值: " << knapsack(W, weights, values, weights.size()) << endl;

    cout << "\n=== 最长公共子序列 ===" << endl;
    string s1 = "ABCDGE", s2 = "EDDGBC";
    cout << "LCS(\"" << s1 << "\", \"" << s2 << "\") = " << lcs(s1, s2) << endl;

    return 0;
}`
  },
  string: {
    name: '字符串处理模板',
    description: '字符串操作函数',
    category: '基础',
    code: `// C++ 字符串处理模板
#include <iostream>
#include <string>
#include <vector>
#include <sstream>
#include <algorithm>
#include <cctype>
using namespace std;

// 字符串分割
vector<string> split(const string& s, char delimiter) {
    vector<string> tokens;
    string token;
    istringstream iss(s);
    while (getline(iss, token, delimiter)) {
        tokens.push_back(token);
    }
    return tokens;
}

// 字符串反转
string reverseString(const string& s) {
    return string(s.rbegin(), s.rend());
}

// 判断回文
bool isPalindrome(const string& s) {
    int left = 0, right = s.size() - 1;
    while (left < right) {
        if (tolower(s[left]) != tolower(s[right])) return false;
        left++;
        right--;
    }
    return true;
}

// 最长公共前缀
string longestCommonPrefix(const vector<string>& strs) {
    if (strs.empty()) return "";
    string prefix = strs[0];
    for (int i = 1; i < strs.size(); i++) {
        while (strs[i].find(prefix) != 0) {
            prefix = prefix.substr(0, prefix.size() - 1);
            if (prefix.empty()) return "";
        }
    }
    return prefix;
}

int main() {
    cout << "=== 字符串分割 ===" << endl;
    string s = "hello,world,foo,bar";
    vector<string> parts = split(s, ',');
    for (const string& p : parts) cout << "[" << p << "] ";
    cout << endl;

    cout << "\n=== 字符串反转 ===" << endl;
    string original = "Hello, C++!";
    cout << "原字符串: " << original << endl;
    cout << "反转后: " << reverseString(original) << endl;

    cout << "\n=== 回文判断 ===" << endl;
    string test1 = "racecar";
    string test2 = "hello";
    cout << "\"" << test1 << "\" 是回文: " << (isPalindrome(test1) ? "是" : "否") << endl;
    cout << "\"" << test2 << "\" 是回文: " << (isPalindrome(test2) ? "是" : "否") << endl;

    cout << "\n=== 最长公共前缀 ===" << endl;
    vector<string> strs = {"flower", "flow", "flight"};
    cout << "[\"flower\", \"flow\", \"flight\"] 的最长公共前缀: "
         << longestCommonPrefix(strs) << endl;

    return 0;
}`
  },
  fileIO: {
    name: '文件读写模板',
    description: '文件操作示例',
    category: '基础',
    code: `// C++ 文件读写模板
#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <sstream>
using namespace std;

// 读取整个文件内容
string readFile(const string& filename) {
    ifstream file(filename);
    if (!file.is_open()) {
        return "错误: 无法打开文件 " + filename;
    }
    stringstream buffer;
    buffer << file.rdbuf();
    file.close();
    return buffer.str();
}

// 写入文件
bool writeFile(const string& filename, const string& content) {
    ofstream file(filename);
    if (!file.is_open()) {
        cout << "错误: 无法创建文件 " << filename << endl;
        return false;
    }
    file << content;
    file.close();
    return true;
}

// 按行读取文件
vector<string> readFileLines(const string& filename) {
    vector<string> lines;
    ifstream file(filename);
    if (!file.is_open()) {
        cout << "错误: 无法打开文件 " << filename << endl;
        return lines;
    }
    string line;
    while (getline(file, line)) {
        lines.push_back(line);
    }
    file.close();
    return lines;
}

int main() {
    cout << "=== 文件读写示例 ===" << endl;

    // 写入示例
    string filename = "test.txt";
    string content = "Hello, File I/O!\\n这是第二行。\\n第三行。";
    if (writeFile(filename, content)) {
        cout << "文件写入成功!" << endl;
    }

    // 读取示例
    cout << "\\n文件内容:\\n" << readFile(filename) << endl;

    // 按行读取
    cout << "\\n按行读取:\\n";
    vector<string> lines = readFileLines(filename);
    for (int i = 0; i < lines.size(); i++) {
        cout << i + 1 << ": " << lines[i] << endl;
    }

    // 注意: 在实际环境中，文件操作需要后端支持
    // 这里仅展示代码结构
    cout << "\\n[提示] 实际文件操作需要后端 API 支持" << endl;

    return 0;
}`
  },
  sorting: {
    name: '排序算法模板',
    description: '多种排序算法实现',
    category: '算法',
    code: `// C++ 排序算法模板
#include <iostream>
#include <vector>
#include <algorithm>
#include <ctime>
using namespace std;

// 冒泡排序
void bubbleSort(vector<int>& arr) {
    int n = arr.size();
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                swap(arr[j], arr[j + 1]);
            }
        }
    }
}

// 选择排序
void selectionSort(vector<int>& arr) {
    int n = arr.size();
    for (int i = 0; i < n - 1; i++) {
        int minIdx = i;
        for (int j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIdx]) {
                minIdx = j;
            }
        }
        swap(arr[i], arr[minIdx]);
    }
}

// 插入排序
void insertionSort(vector<int>& arr) {
    int n = arr.size();
    for (int i = 1; i < n; i++) {
        int key = arr[i];
        int j = i - 1;
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            j--;
        }
        arr[j + 1] = key;
    }
}

// 归并排序
void merge(vector<int>& arr, int left, int mid, int right) {
    vector<int> temp(right - left + 1);
    int i = left, j = mid + 1, k = 0;
    while (i <= mid && j <= right) {
        if (arr[i] <= arr[j]) temp[k++] = arr[i++];
        else temp[k++] = arr[j++];
    }
    while (i <= mid) temp[k++] = arr[i++];
    while (j <= right) temp[k++] = arr[j++];
    for (int p = 0; p < k; p++) arr[left + p] = temp[p];
}

void mergeSort(vector<int>& arr, int left, int right) {
    if (left < right) {
        int mid = left + (right - left) / 2;
        mergeSort(arr, left, mid);
        mergeSort(arr, mid + 1, right);
        merge(arr, left, mid, right);
    }
}

int main() {
    vector<int> data1 = {64, 34, 25, 12, 22, 11, 90};
    vector<int> data2 = data1;
    vector<int> data3 = data1;

    cout << "=== 排序算法演示 ===" << endl;
    cout << "原始数据: ";
    for (int n : data1) cout << n << " ";
    cout << endl;

    // 冒泡排序
    bubbleSort(data1);
    cout << "冒泡排序: ";
    for (int n : data1) cout << n << " ";
    cout << endl;

    // 选择排序
    selectionSort(data2);
    cout << "选择排序: ";
    for (int n : data2) cout << n << " ";
    cout << endl;

    // 插入排序
    insertionSort(data3);
    cout << "插入排序: ";
    for (int n : data3) cout << n << " ";
    cout << endl;

    // 使用 STL 的排序
    vector<int> data4 = {64, 34, 25, 12, 22, 11, 90};
    sort(data4.begin(), data4.end());
    cout << "STL sort: ";
    for (int n : data4) cout << n << " ";
    cout << endl;

    return 0;
}`
  },
  graph: {
    name: '图算法模板',
    description: 'BFS/DFS/最短路径',
    category: '算法',
    code: `// C++ 图算法模板
#include <iostream>
#include <vector>
#include <queue>
#include <stack>
#include <limits>
using namespace std;

// 图的邻接表表示
class Graph {
private:
    int V;
    vector<vector<int>> adj;
public:
    Graph(int v) : V(v), adj(v) {}

    void addEdge(int v, int w) {
        adj[v].push_back(w);
    }

    // BFS 遍历
    void bfs(int start) {
        vector<bool> visited(V, false);
        queue<int> q;
        visited[start] = true;
        q.push(start);

        cout << "BFS: ";
        while (!q.empty()) {
            int v = q.front();
            cout << v << " ";
            q.pop();
            for (int n : adj[v]) {
                if (!visited[n]) {
                    visited[n] = true;
                    q.push(n);
                }
            }
        }
        cout << endl;
    }

    // DFS 遍历
    void dfs(int start) {
        vector<bool> visited(V, false);
        stack<int> s;
        s.push(start);

        cout << "DFS: ";
        while (!s.empty()) {
            int v = s.top();
            s.pop();
            if (!visited[v]) {
                visited[v] = true;
                cout << v << " ";
                for (int i = adj[v].size() - 1; i >= 0; i--) {
                    if (!visited[adj[v][i]]) {
                        s.push(adj[v][i]);
                    }
                }
            }
        }
        cout << endl;
    }

    // Dijkstra 最短路径
    void dijkstra(int start) {
        vector<int> dist(V, numeric_limits<int>::max());
        dist[start] = 0;
        priority_queue<pair<int, int>, vector<pair<int, int>>, greater<pair<int, int>>> pq;
        pq.push({0, start});

        while (!pq.empty()) {
            int d = pq.top().first;
            int v = pq.top().second;
            pq.pop();

            if (d > dist[v]) continue;

            for (int n : adj[v]) {
                if (dist[v] + 1 < dist[n]) {
                    dist[n] = dist[v] + 1;
                    pq.push({dist[n], n});
                }
            }
        }

        cout << "从 " << start << " 出发的最短距离: ";
        for (int i = 0; i < V; i++) {
            cout << dist[i] << " ";
        }
        cout << endl;
    }
};

int main() {
    cout << "=== 图算法演示 ===" << endl;

    Graph g(7);
    g.addEdge(0, 1);
    g.addEdge(0, 2);
    g.addEdge(1, 3);
    g.addEdge(1, 4);
    g.addEdge(2, 3);
    g.addEdge(2, 5);
    g.addEdge(3, 5);
    g.addEdge(3, 6);
    g.addEdge(4, 6);
    g.addEdge(5, 6);

    g.bfs(0);
    g.dfs(0);
    g.dijkstra(0);

    return 0;
}`
  }
};

// Default C++ code template
const DEFAULT_CODE = cppTemplates.default.code;

// ============================================================================
// Enhanced Error Handling
// ============================================================================
export const cppErrorPatterns = [
  // Syntax errors
  { pattern: /error: (.+)/i, type: 'syntax', category: '语法错误' },
  { pattern: /expected (.+)/i, type: 'syntax', category: '语法错误' },
  { pattern: /unexpected (.+)/i, type: 'syntax', category: '语法错误' },
  { pattern: /(.+) was not declared in this scope/i, type: 'undeclared', category: '未声明' },
  { pattern: /(.+) was not declared in this scope/i, type: 'undeclared', category: '未声明' },

  // Type errors
  { pattern: /error: cannot convert (.+) to (.+)/i, type: 'type', category: '类型错误' },
  { pattern: /error: invalid conversion from (.+) to (.+)/i, type: 'type', category: '类型错误' },

  // Memory errors
  { pattern: /error: (.+) is not a class or struct/i, type: 'type', category: '类型错误' },
  { pattern: /Segmentation fault/i, type: 'runtime', category: '运行时错误' },
  { pattern: /core dumped/i, type: 'runtime', category: '运行时错误' },

  // Linker errors
  { pattern: /undefined reference to (.+)/i, type: 'linker', category: '链接错误' },
  { pattern: /error: ld returned (\d+) exit status/i, type: 'linker', category: '链接错误' },

  // Compiler errors
  { pattern: /fatal error: (.+): No such file or directory/i, type: 'include', category: '头文件错误' },
  { pattern: /error: (.+) file not found/i, type: 'include', category: '头文件错误' },
  { pattern: /compilation terminated/i, type: 'compile', category: '编译终止' },

  // Common C++ specific errors
  { pattern: /error: request for member (.+) in (.+), which is of non-class type/i, type: 'member', category: '成员访问错误' },
  { pattern: /error: base class (.+) has incomplete type/i, type: 'incomplete', category: '不完整类型' },
  { pattern: /error: redefinition of (.+)/i, type: 'redefinition', category: '重复定义' },
  { pattern: /error: previous declaration of (.+)/i, type: 'redefinition', category: '重复定义' },

  // Warning patterns (treated as errors when -Werror)
  { pattern: /warning: (.+)/i, type: 'warning', category: '警告' },
  { pattern: /deprecated: (.+)/i, type: 'warning', category: '弃用警告' },
];

export const cppErrorSuggestions = {
  '语法错误': [
    '检查括号和分号是否匹配',
    '确保每条语句以分号结束',
    '检查关键字拼写是否正确',
  ],
  '未声明': [
    '确保变量或函数在使用前已声明',
    '检查变量名拼写是否正确',
    '确保包含必要的头文件',
  ],
  '类型错误': [
    '检查类型转换是否正确',
    '确保左右值类型匹配',
    '使用正确的类型转换语法',
  ],
  '运行时错误': [
    '检查数组越界访问',
    '确保指针不为空',
    '检查内存分配是否成功',
  ],
  '链接错误': [
    '确保所有函数都有实现',
    '检查库文件是否正确链接',
    '确认符号命名一致',
  ],
  '头文件错误': [
    '检查头文件路径是否正确',
    '确保头文件存在',
    '使用正确的 include 语法',
  ],
  '成员访问错误': [
    '检查对象类型是否正确',
    '确保使用正确的成员访问运算符',
    '验证结构体/类定义是否完整',
  ],
  '重复定义': [
    '使用头文件保护符防止重复包含',
    '检查是否有多个相同的变量定义',
    '使用 extern 声明全局变量',
  ],
  '警告': [
    '查看具体警告信息',
    '使用 -Wall 启用所有警告',
    '修复警告可以避免潜在错误',
  ],
};

export const cppFeatures = {
  templates: Object.keys(cppTemplates).length,
  categories: [...new Set(Object.values(cppTemplates).map(t => t.category))],
  errorPatterns: cppErrorPatterns.length,
  errorCategories: Object.keys(cppErrorSuggestions).length,
};

// Parse and categorize error messages
const parseError = (errorMsg) => {
  for (const { pattern, type, category } of cppErrorPatterns) {
    const match = errorMsg.match(pattern);
    if (match) {
      return {
        type,
        category,
        message: match[0],
        details: match.slice(1),
        suggestion: cppErrorSuggestions[category] || [],
      };
    }
  }
  return {
    type: 'unknown',
    category: '未知错误',
    message: errorMsg,
    details: [],
    suggestion: ['请检查代码是否符合 C++ 语法规范'],
  };
};

// Format error for display
const formatError = (error) => {
  const lines = [
    `【${error.category}】`,
    error.message,
  ];
  if (error.suggestion.length > 0) {
    lines.push('');
    lines.push('建议:');
    error.suggestion.forEach(s => lines.push(`  - ${s}`));
  }
  return lines.join('\n');
};

// ============================================================================
// Main C++ Editor Component
// ============================================================================
const CppEditor = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState(DEFAULT_CODE);
  const [output, setOutput] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [activeTab, setActiveTab] = useState('editor');
  const [fontSize, setFontSize] = useState(14);
  const [showHistory, setShowHistory] = useState(false);
  const [historyList, setHistoryList] = useState([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [projectName, setProjectName] = useState('我的C++项目');
  const [savedProjects, setSavedProjects] = useState([]);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [compilationError, setCompilationError] = useState('');
  const [executionId, setExecutionId] = useState(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showErrorDetail, setShowErrorDetail] = useState(false);
  const [currentError, setCurrentError] = useState(null);

  const codeRef = useRef(code);
  const editorContainerRef = useRef(null);
  const editorViewRef = useRef(null);

  // Initialize CodeMirror editor
  useEffect(() => {
    if (!editorContainerRef.current) return;

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const newCode = update.state.doc.toString();
        setCode(newCode);
      }
    });

    const state = EditorState.create({
      doc: code,
      extensions: [
        basicSetup,
        cpp(),
        oneDark,
        updateListener,
        EditorView.theme({
          '&': { height: '100%' },
          '.cm-scroller': { overflow: 'auto' },
          '.cm-content': { fontFamily: 'Consolas, Monaco, "Courier New", monospace', fontSize: `${fontSize}px` },
          '.cm-gutters': { background: '#1e1e1e', borderRight: '1px solid #444' },
          '.cm-activeLineGutter': { background: '#2d2d2d' },
          '.cm-activeLine': { background: '#2d2d2d' },
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: editorContainerRef.current,
    });

    editorViewRef.current = view;

    return () => {
      view.destroy();
    };
  }, []);

  // Update font size when changed
  useEffect(() => {
    if (editorViewRef.current) {
      editorViewRef.current.dispatch({
        effects: EditorView.theme({
          '.cm-content': { fontFamily: 'Consolas, Monaco, "Courier New", monospace', fontSize: `${fontSize}px` },
        }).parse(),
      });
    }
  }, [fontSize]);

  // Sync code from outside (e.g., template selection)
  useEffect(() => {
    if (editorViewRef.current) {
      const currentCode = editorViewRef.current.state.doc.toString();
      if (currentCode !== code) {
        editorViewRef.current.dispatch({
          changes: { from: 0, to: currentCode.length, insert: code },
        });
      }
    }
  }, [code]);

  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  const handleOutput = useCallback((entry) => {
    setOutput(prev => [...prev, entry]);
  }, []);

  const handleClear = () => {
    setOutput([]);
    setCompilationError('');
    setCurrentError(null);
  };

  const log = (message, type = 'log') => {
    const entry = { message: String(message), type, timestamp: Date.now() };
    handleOutput(entry);
  };

  const logError = (message) => {
    const entry = { message: String(message), type: 'error', timestamp: Date.now() };
    handleOutput(entry);
  };

  // Handle template selection
  const handleSelectTemplate = (templateKey) => {
    const template = cppTemplates[templateKey];
    if (template) {
      setCode(template.code);
      setProjectName(template.name);
      setShowTemplateModal(false);
      message.success(`已加载模板: ${template.name}`);
    }
  };

  // Compile and run C++ code using backend API
  const handleRun = async () => {
    if (isRunning || isCompiling) return;

    setIsCompiling(true);
    setActiveTab('output');
    handleClear();
    log('=== 正在编译 C++ 代码 ===', 'info');

    try {
      // First create a code execution record
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      const createResult = await createCodeExecution({
        userId: user?.id,
        language: 'cpp',
        code: code,
      });

      if (createResult.status !== 200) {
        throw new Error('创建执行任务失败');
      }

      const execId = createResult.result?.id;
      if (!execId) {
        throw new Error('无法获取执行ID');
      }

      setExecutionId(execId);
      setIsCompiling(false);
      setIsRunning(true);
      log('编译成功，正在运行程序...', 'info');

      // Execute the code
      const execResult = await executeCode(execId);

      setIsRunning(false);

      if (execResult.status === 200) {
        const result = execResult.result;
        if (result.errorMessage) {
          // Parse error with enhanced error handling
          const parsedError = parseError(result.errorMessage);
          setCurrentError(parsedError);
          logError(`\n=== ${parsedError.category} ===\n${parsedError.message}`);
          logError('\n[点击"详情"查看分析和建议]', 'warn');
        } else {
          if (result.output) {
            log(`\n=== 程序输出 ===\n${result.output}`, 'log');
          } else {
            log('\n=== 程序运行完成（无输出）===', 'info');
          }
        }
        log(`\n=== 执行完成 ===\n耗时: ${result.executionTime || 0}ms`, 'info');
      } else {
        const parsedError = parseError(execResult.message || '未知错误');
        setCurrentError(parsedError);
        logError(`\n=== ${parsedError.category} ===\n${parsedError.message}`);
        logError('\n[点击"详情"查看分析和建议]', 'warn');
      }
    } catch (error) {
      setIsRunning(false);
      setIsCompiling(false);
      const parsedError = parseError(error.message || '编译/运行失败');
      setCurrentError(parsedError);
      logError(`\n=== ${parsedError.category} ===\n${parsedError.message}`);
      logError('\n[点击"详情"查看分析和建议]', 'warn');

      // Check if it's a compiler not found error
      if (error.message?.includes('compiler') || error.message?.includes('g++')) {
        logError('\n提示: 请确保已安装 MinGW-w64 编译器并将其添加到系统 PATH 环境变量中。');
        logError('安装命令: winget install MartinStorsjo.LLVM-MinGW.MSVCRT');
      }
    }
  };

  const handleStop = async () => {
    if (executionId && isRunning) {
      try {
        await deleteCodeExecution(executionId);
      } catch (e) {
        console.error('Stop execution error:', e);
      }
    }
    setIsRunning(false);
    setIsCompiling(false);
    log('\n=== 执行已停止 ===', 'warn');
  };

  const handleSaveToCloud = async () => {
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      if (currentProjectId) {
        await updateProject(currentProjectId, {
          name: projectName,
          type: 'cpp',
          content: code,
        });
        message.success('项目已更新');
      } else {
        const result = await createProject({
          name: projectName,
          type: 'cpp',
          content: code,
          userId: user?.id,
        });
        if (result) {
          setCurrentProjectId(result.id);
          message.success('项目已保存');
        }
      }
      setShowSaveModal(false);
    } catch (error) {
      console.error('保存失败:', error);
      message.error('保存失败，请重试');
    }
  };

  const handleLoadProjects = async () => {
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      const projects = await getProjects(user?.id);
      const cppProjects = Array.isArray(projects)
        ? projects.filter(p => p.type === 'cpp')
        : [];
      setSavedProjects(cppProjects);
      setShowHistory(true);
    } catch (error) {
      console.error('加载项目列表失败:', error);
    }
  };

  const handleLoadProject = async (project) => {
    setCode(project.content || DEFAULT_CODE);
    setProjectName(project.name);
    setCurrentProjectId(project.id);
    setShowHistory(false);
    message.success(`已加载项目: ${project.name}`);
  };

  const handleNewProject = () => {
    setCode(DEFAULT_CODE);
    setProjectName('我的C++项目');
    setCurrentProjectId(null);
    setShowHistory(false);
    message.success('已创建新项目');
  };

  const handleDeleteProject = async (id) => {
    try {
      await deleteProject(id);
      setSavedProjects(prev => prev.filter(p => p.id !== id));
      message.success('项目已删除');
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    message.success('代码已复制到剪贴板');
  };

  const handleFormatCode = () => {
    // Basic C++ formatting - just for display purposes
    const lines = code.split('\n');
    const formatted = lines.map(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('//')) return line; // Keep comments as-is
      if (trimmed.startsWith('#')) return line; // Keep preprocessor as-is
      return line.trimEnd();
    }).join('\n');
    setCode(formatted);
    message.success('代码已格式化');
  };

  const handleDownloadCode = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName}.cpp`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getOutputStyle = (type) => {
    switch (type) {
      case 'error': return { color: '#ff6b6b' };
      case 'warn': return { color: '#ffd93d' };
      case 'info': return { color: '#6bcbff' };
      case 'code': return { color: '#98d8aa' };
      default: return { color: '#fff' };
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#1e1e1e' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 16px',
        background: '#323233',
        borderBottom: '1px solid #444'
      }}>
        <Space>
          <Button
            icon={isCompiling || isRunning ? <LoadingOutlined /> : <PlayCircleOutlined />}
            type="primary"
            onClick={handleRun}
            disabled={isRunning || isCompiling}
          >
            {isCompiling ? '编译中' : isRunning ? '运行中' : '编译运行'}
          </Button>
          <Button icon={<StopOutlined />} onClick={handleStop} disabled={!isRunning && !isCompiling}>
            停止
          </Button>
          <Button icon={<ClearOutlined />} onClick={handleClear}>
            清空输出
          </Button>
        </Space>

        <Space>
          <span style={{ color: '#fff', fontSize: 14 }}>字体大小:</span>
          <Select
            value={fontSize}
            onChange={setFontSize}
            style={{ width: 80 }}
            size="small"
            options={[
              { value: 12, label: '12px' },
              { value: 14, label: '14px' },
              { value: 16, label: '16px' },
              { value: 18, label: '18px' },
              { value: 20, label: '20px' },
            ]}
          />
        </Space>

        <Space>
          <Button icon={<FolderOpenOutlined />} onClick={handleLoadProjects}>
            打开
          </Button>
          <Button icon={<SaveOutlined />} onClick={() => setShowSaveModal(true)}>
            保存
          </Button>
          <Button icon={<SnippetsOutlined />} onClick={() => setShowTemplateModal(true)}>
            模板
          </Button>
          <Dropdown overlay={
            <Space direction="vertical" style={{ padding: 8 }}>
              <Button icon={<CopyOutlined />} onClick={handleCopyCode}>复制代码</Button>
              <Button icon={<FormatPainterOutlined />} onClick={handleFormatCode}>格式化</Button>
              <Button icon={<DownloadOutlined />} onClick={handleDownloadCode}>下载.cpp文件</Button>
            </Space>
          }>
            <Button icon={<EditOutlined />}>更多</Button>
          </Dropdown>
        </Space>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Editor panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid #444' }}>
          <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ height: '100%' }}>
            <TabPane tab="编辑器" key="editor" style={{ height: '100%' }}>
              <div style={{ flex: 1, padding: 0, height: '100%' }} ref={editorContainerRef} />
            </TabPane>
            <TabPane tab="历史记录" key="history">
              <div style={{ padding: 16 }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Button type="primary" icon={<PlusOutlined />} onClick={handleNewProject} block>
                    新建项目
                  </Button>
                  {savedProjects.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#888', padding: 40 }}>暂无保存的项目</div>
                  ) : (
                    savedProjects.map(project => (
                      <div key={project.id} style={{
                        padding: 12,
                        background: '#252526',
                        borderRadius: 4,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <div style={{ color: '#fff', fontWeight: 500 }}>{project.name}</div>
                          <div style={{ color: '#888', fontSize: 12 }}>
                            更新于: {new Date(project.updatedAt).toLocaleString()}
                          </div>
                        </div>
                        <Space>
                          <Button size="small" onClick={() => handleLoadProject(project)}>打开</Button>
                          <Button size="small" danger onClick={() => handleDeleteProject(project.id)}>删除</Button>
                        </Space>
                      </div>
                    ))
                  )}
                </Space>
              </div>
            </TabPane>
          </Tabs>
        </div>

        {/* Output panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#1e1e1e' }}>
          <div style={{
            padding: '8px 12px',
            background: '#323233',
            borderBottom: '1px solid #444',
            color: '#fff',
            fontWeight: 500,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Space>
              <span>输出控制台</span>
              {isCompiling && <Tag color="orange" style={{ marginLeft: 8 }}>编译中</Tag>}
              {isRunning && <Tag color="blue" style={{ marginLeft: 8 }}>运行中</Tag>}
            </Space>
            {currentError && (
              <Button
                size="small"
                icon={<WarningOutlined />}
                onClick={() => setShowErrorDetail(true)}
              >
                错误详情
              </Button>
            )}
          </div>
          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: 12,
            fontFamily: 'Consolas, Monaco, monospace',
            fontSize: fontSize - 2,
            lineHeight: 1.6
          }}>
            {output.length === 0 && (
              <div style={{ color: '#888' }}>控制台输出将显示在这里...</div>
            )}
            {output.map((entry, idx) => (
              <div key={idx} style={{ ...getOutputStyle(entry.type), whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {entry.type === 'error' && <span style={{ color: '#ff6b6b' }}>[错误] </span>}
                {entry.type === 'warn' && <span style={{ color: '#ffd93d' }}>[警告] </span>}
                {entry.type === 'info' && <span style={{ color: '#6bcbff' }}>[信息] </span>}
                {entry.message}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Save Modal */}
      <Modal
        title="保存项目"
        open={showSaveModal}
        onCancel={() => setShowSaveModal(false)}
        footer={null}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <label style={{ display: 'block', marginBottom: 8, color: '#fff' }}>项目名称:</label>
            <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} />
          </div>
          <Button type="primary" onClick={handleSaveToCloud} block>
            保存到云端
          </Button>
        </Space>
      </Modal>

      {/* Template Selection Modal */}
      <Modal
        title="选择代码模板"
        open={showTemplateModal}
        onCancel={() => setShowTemplateModal(false)}
        footer={null}
        width={700}
      >
        <div style={{ maxHeight: 400, overflow: 'auto' }}>
          {Object.entries(cppTemplates).map(([key, template]) => (
            <div
              key={key}
              onClick={() => handleSelectTemplate(key)}
              style={{
                padding: 12,
                marginBottom: 8,
                background: '#252526',
                borderRadius: 4,
                cursor: 'pointer',
                border: '1px solid transparent',
                transition: 'border-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#1890ff'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
            >
              <div style={{ color: '#fff', fontWeight: 500, marginBottom: 4 }}>
                {template.name}
                <Tag color="blue" style={{ marginLeft: 8 }}>{template.category}</Tag>
              </div>
              <div style={{ color: '#888', fontSize: 12 }}>
                {template.description}
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* Error Detail Modal */}
      <Modal
        title={`错误分析: ${currentError?.category || '未知错误'}`}
        open={showErrorDetail}
        onCancel={() => setShowErrorDetail(false)}
        footer={null}
        width={600}
      >
        {currentError && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div style={{ background: '#2d2d2d', padding: 12, borderRadius: 4 }}>
              <div style={{ color: '#ff6b6b', fontWeight: 500, marginBottom: 8 }}>错误信息:</div>
              <pre style={{ color: '#d4d4d4', margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'Consolas, Monaco, monospace' }}>
                {currentError.message}
              </pre>
            </div>

            <div style={{ background: '#2d2d2d', padding: 12, borderRadius: 4 }}>
              <div style={{ color: '#ffd93d', fontWeight: 500, marginBottom: 8 }}>错误类型:</div>
              <div style={{ color: '#d4d4d4' }}>{currentError.category}</div>
            </div>

            <div style={{ background: '#2d2d2d', padding: 12, borderRadius: 4 }}>
              <div style={{ color: '#6bcbff', fontWeight: 500, marginBottom: 8 }}>建议修复:</div>
              <ul style={{ color: '#d4d4d4', margin: 0, paddingLeft: 20 }}>
                {currentError.suggestion.map((s, i) => (
                  <li key={i} style={{ marginBottom: 4 }}>{s}</li>
                ))}
              </ul>
            </div>

            <Button type="primary" onClick={() => setShowErrorDetail(false)} block>
              关闭
            </Button>
          </Space>
        )}
      </Modal>
    </div>
  );
};

export default CppEditor;