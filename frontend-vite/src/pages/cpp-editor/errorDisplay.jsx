import React, { useState, useMemo } from 'react';
import { Tag, Button, Space, Collapse, Empty } from 'antd';
import {
  CloseCircleOutlined, WarningOutlined, InfoCircleOutlined,
  BugOutlined, FileTextOutlined, CopyOutlined, CheckCircleOutlined
} from '@ant-design/icons';

// ============================================================================
// C++ Error Pattern Definitions
// ============================================================================
const ERROR_PATTERNS = [
  // Syntax errors - missing parts
  {
    pattern: /error: expected (.+?) before ['"`]?(.+?)['"`]?/i,
    type: 'syntax',
    category: '语法错误',
    severity: 'error',
    explanation: '编译器期望在指定位置看到某个语法元素，但实际没有找到'
  },
  {
    pattern: /error: expected (.+?) at end of input/i,
    type: 'syntax',
    category: '语法错误',
    severity: 'error',
    explanation: '文件在期望的结束符之前就已经结束'
  },
  {
    pattern: /error: expected initializer/i,
    type: 'syntax',
    category: '语法错误',
    severity: 'error',
    explanation: '期望有一个初始化表达式'
  },
  {
    pattern: /error: (.+?) was not declared in this scope/i,
    type: 'undeclared',
    category: '未声明',
    severity: 'error',
    explanation: '使用的变量或函数在当前作用域内没有声明'
  },
  {
    pattern: /error: (.+?) was not declared/i,
    type: 'undeclared',
    category: '未声明',
    severity: 'error',
    explanation: '标识符未声明，可能需要包含头文件或检查拼写'
  },
  {
    pattern: /error: (.+?) has incomplete type/i,
    type: 'incomplete',
    category: '不完整类型',
    severity: 'error',
    explanation: '类型定义不完整，无法完成编译'
  },

  // Type errors
  {
    pattern: /error: cannot convert '(.+?)' to '(.+?)'/i,
    type: 'type',
    category: '类型错误',
    severity: 'error',
    explanation: '无法将一种类型转换为另一种类型'
  },
  {
    pattern: /error: invalid conversion from (.+?) to (.+?)/i,
    type: 'type',
    category: '类型错误',
    severity: 'error',
    explanation: '无效的类型转换'
  },
  {
    pattern: /error: cannot initialize '(.+?)' of type '(.+?)'/i,
    type: 'type',
    category: '类型错误',
    severity: 'error',
    explanation: '无法用给定值初始化指定类型的变量'
  },
  {
    pattern: /error: incompatible types/i,
    type: 'type',
    category: '类型错误',
    severity: 'error',
    explanation: '操作符两边的类型不兼容'
  },
  {
    pattern: /error: ambiguous overload for '(.+?)'/i,
    type: 'type',
    category: '类型错误',
    severity: 'error',
    explanation: '函数调用存在歧义，无法确定使用哪个重载版本'
  },

  // Memory errors
  {
    pattern: /Segmentation fault/i,
    type: 'runtime',
    category: '段错误',
    severity: 'error',
    explanation: '程序试图访问不该访问的内存区域'
  },
  {
    pattern: /core dumped/i,
    type: 'runtime',
    category: '运行时错误',
    severity: 'error',
    explanation: '程序崩溃并产生了核心转储文件'
  },
  {
    pattern: /abort/i,
    type: 'runtime',
    category: '运行时错误',
    severity: 'error',
    explanation: '程序异常终止'
  },
  {
    pattern: /stack overflow/i,
    type: 'runtime',
    category: '栈溢出',
    severity: 'error',
    explanation: '递归深度过大或局部变量占用过多栈空间'
  },

  // Linker errors
  {
    pattern: /undefined reference to `(.+?)'/i,
    type: 'linker',
    category: '链接错误',
    severity: 'error',
    explanation: '函数或变量有声明但没有定义（实现）'
  },
  {
    pattern: /undefined reference to (.+?)/i,
    type: 'linker',
    category: '链接错误',
    severity: 'error',
    explanation: '链接时找不到该符号的定义'
  },
  {
    pattern: /error: ld returned (\d+) exit status/i,
    type: 'linker',
    category: '链接错误',
    severity: 'error',
    explanation: '链接器返回了错误状态码'
  },
  {
    pattern: /multiple definition of `(.+?)'/i,
    type: 'linker',
    category: '链接错误',
    severity: 'error',
    explanation: '同一符号有多于一个定义'
  },

  // Include errors
  {
    pattern: /fatal error: (.+?): No such file or directory/i,
    type: 'include',
    category: '头文件错误',
    severity: 'error',
    explanation: '找不到指定的头文件'
  },
  {
    pattern: /error: (.+?) file not found/i,
    type: 'include',
    category: '头文件错误',
    severity: 'error',
    explanation: '头文件不存在'
  },

  // Scope errors
  {
    pattern: /error: '(.+?)' is not a class or struct/i,
    type: 'member',
    category: '成员访问错误',
    severity: 'error',
    explanation: '试图访问一个非类/结构体类型的成员'
  },
  {
    pattern: /error: request for member '(.+?)' in '(.+?)', which is of non-class type/i,
    type: 'member',
    category: '成员访问错误',
    severity: 'error',
    explanation: '试图用点运算符访问非类类型的成员'
  },
  {
    pattern: /error: base class '(.+?)' has incomplete type/i,
    type: 'incomplete',
    category: '不完整类型',
    severity: 'error',
    explanation: '基类类型不完整，无法完成继承'
  },

  // Redefinition errors
  {
    pattern: /error: redefinition of '(.+?)'/i,
    type: 'redefinition',
    category: '重复定义',
    severity: 'error',
    explanation: '同一名称被多次定义'
  },
  {
    pattern: /error: previous declaration of '(.+?)'/i,
    type: 'redefinition',
    category: '重复定义',
    severity: 'error',
    explanation: '与之前的声明冲突'
  },

  // Memory allocation errors
  {
    pattern: /error: invalid use of flexible array/i,
    type: 'memory',
    category: '内存错误',
    severity: 'error',
    explanation: '灵活数组成员使用方式不正确'
  },
  {
    pattern: /error: too many initializers/i,
    type: 'initialization',
    category: '初始化错误',
    severity: 'error',
    explanation: '初始化元素数量超过了目标类型的容量'
  },

  // Template errors
  {
    pattern: /error: no matching function for call to '(.+?)'/i,
    type: 'template',
    category: '模板错误',
    severity: 'error',
    explanation: '没有找到匹配参数类型的函数'
  },
  {
    pattern: /error: template-class difference/i,
    type: 'template',
    category: '模板错误',
    severity: 'error',
    explanation: '模板类和普通类的使用方式不匹配'
  },

  // Warnings treated as errors
  {
    pattern: /warning: (.+)/i,
    type: 'warning',
    category: '警告',
    severity: 'warning',
    explanation: '代码存在潜在问题，编译器给出警告'
  },
  {
    pattern: /deprecated: (.+)/i,
    type: 'warning',
    category: '弃用警告',
    severity: 'warning',
    explanation: '使用的特性已被弃用，建议使用新特性'
  },

  // Info messages
  {
    pattern: /note: (.+)/i,
    type: 'info',
    category: '提示',
    severity: 'info',
    explanation: '编译器的补充说明信息'
  },
];

// ============================================================================
// Error Suggestions Database
// ============================================================================
const ERROR_SUGGESTIONS = {
  '语法错误': [
    '检查括号、方括号、花括号是否正确配对',
    '确保每条语句以分号（;）结束',
    '检查关键字拼写是否正确（例如：int 而不是 lnt）',
    '确保类/结构体/函数定义的结束大括号后有分号（如果是类型声明）',
    '检查模板语法：template<typename T>'
  ],
  '未声明': [
    '确认变量或函数在使用前已声明',
    '检查标识符拼写是否完全一致（包括大小写）',
    '确保已包含必要的头文件（#include）',
    '检查变量作用域，确认在当前代码块内已声明',
    '如果使用命名空间，确认已 using namespace std 或使用 std:: 前缀',
    '确认使用的是 C++ 编译器而非 C 编译器'
  ],
  '类型错误': [
    '检查类型转换是否合法',
    '确保赋值左右两边类型兼容',
    '使用 static_cast<T>() 进行显式类型转换',
    '检查函数参数类型是否与调用时传递的参数类型匹配',
    '注意隐式类型转换可能带来的精度损失',
    '确保数值运算不会导致溢出'
  ],
  '段错误': [
    '检查数组/vector 是否有越界访问',
    '确保指针在使用前不为 NULL',
    '检查是否访问了已释放的内存',
    '检查递归终止条件是否正确，避免无限递归',
    '使用 GDB 调试器定位具体崩溃位置',
    '在可疑位置添加打印语句定位问题'
  ],
  '运行时错误': [
    '检查除法运算除数是否可能为零',
    '确保 vector/map 等容器在访问元素前不为空',
    '检查循环终止条件是否正确',
    '使用 assert() 进行运行时断言检查',
    '检查字符串操作是否越界'
  ],
  '栈溢出': [
    '减少递归深度，改用迭代（循环）实现',
    '减少局部变量占用空间',
    '将大数组改为动态分配（堆内存）',
    '检查递归终止条件是否正确',
    '可以使用尾递归优化（编译器支持时）'
  ],
  '链接错误': [
    '确保所有函数都有实现（非仅声明）',
    '检查库文件是否正确链接到项目',
    '确认函数签名（参数类型和个数）完全一致',
    '检查是否正确使用 extern 声明全局变量',
    '确保静态变量有定义（非仅 extern 声明）',
    '检查是否有多个 cpp 文件定义了相同函数'
  ],
  '头文件错误': [
    '检查头文件路径是否正确',
    '确认头文件存在且可访问',
    '使用 <> 包围系统头文件，"" 包围本地头文件',
    '检查项目的 include 路径设置',
    '注意文件名大小写（Linux 区分大小写）'
  ],
  '作用域错误': [
    '检查变量是否在正确的作用域内使用',
    '确保没有在 if/for/while 块内重复声明同名变量',
    '使用 :: 运算符指定命名空间',
    '检查是否在更内层作用域中遮盖了外层变量'
  ],
  '成员访问错误': [
    '检查对象类型是否正确（结构体 vs 类）',
    '确保使用正确的成员访问运算符（. 或 ->）',
    '验证结构体/类定义是否完整',
    '检查指针是否有效（非 NULL）',
    '对于指针使用 ->，对于对象使用 .'
  ],
  '不完整类型': [
    '检查类/结构体是否完整定义（不是仅有前向声明）',
    '确保头文件正确包含',
    '避免在前向声明时使用需要完整类型的操作',
    '检查是否有循环依赖导致类型不完整'
  ],
  '内存错误': [
    '检查数组大小是否在编译时确定',
    '确保动态内存分配（new）成功',
    '避免访问越界内存',
    '使用智能指针（unique_ptr/shared_ptr）管理内存',
    '避免重复 delete 或 delete 空指针'
  ],
  '初始化错误': [
    '检查初始化列表是否正确',
    '确保构造函数参数匹配',
    '避免过度初始化（初始值超过容量）',
    '检查类成员初始化顺序'
  ],
  '模板错误': [
    '检查模板参数是否正确指定',
    '确保模板函数/类实例化完整',
    '查看具体的模板错误信息（通常很长）',
    '使用 typename 关键字消除作用域歧义',
    '检查模板参数推导是否唯一'
  ],
  '重复定义': [
    '使用 #ifndef/#define/#endif 防止头文件重复包含',
    '检查是否在头文件中定义了变量（应声明为 extern）',
    '确保只有一个 cpp 文件定义该变量',
    '使用 inline 变量（C++17）'
  ],
  '警告': [
    '启用 -Wall 查看所有警告',
    '修复警告可以避免潜在错误',
    '使用 #pragma GCC diagnostic 忽略特定警告',
    '常见的未使用变量、隐式转换等警告',
    '添加 (void)var 消除未使用变量警告'
  ],
  '弃用警告': [
    '检查 API 是否已过时',
    '使用新的 API 替代',
    '查看编译器文档了解替代方案',
    '如需继续使用，可忽略警告（不推荐）'
  ],
  '提示': [
    '仔细阅读编译器的详细提示',
    '提示通常指向问题的真正原因',
    '按照提示信息修正代码',
    'note 信息通常提供额外的上下文'
  ],
  '未知错误': [
    '请检查代码是否符合 C++ 语法规范',
    '尝试简化代码定位问题',
    '查看完整的错误输出',
    '搜索具体错误信息获取帮助',
    '检查是否是编译器版本兼容性问题'
  ]
};

// ============================================================================
// Error Location Parser
// ============================================================================
const parseErrorLocation = (errorMsg) => {
  // Match patterns like: file.cpp:line:column: or file.cpp:line:
  const locationMatch = errorMsg.match(/([a-zA-Z_][a-zA-Z0-9_./\\-]*\.(?:cpp|cpp|h|hpp|c|cxx|cc)):?(\d+)?:?(\d+)?:/i);
  if (locationMatch) {
    return {
      file: locationMatch[1],
      line: locationMatch[2] ? parseInt(locationMatch[2], 10) : null,
      column: locationMatch[3] ? parseInt(locationMatch[3], 10) : null
    };
  }

  // Match just line number: In function/main at line 42
  const functionLineMatch = errorMsg.match(/at line (\d+)/i);
  if (functionLineMatch) {
    return {
      file: null,
      line: parseInt(functionLineMatch[1], 10),
      column: null
    };
  }

  return { file: null, line: null, column: null };
};

// ============================================================================
// Main Error Parser
// ============================================================================
export const parseCppError = (errorMsg) => {
  const location = parseErrorLocation(errorMsg);

  // Try to match against known patterns
  for (const pattern of ERROR_PATTERNS) {
    const match = errorMsg.match(pattern.pattern);
    if (match) {
      return {
        type: pattern.type,
        category: pattern.category,
        severity: pattern.severity,
        message: match[0],
        details: match.slice(1),
        line: location.line,
        column: location.column,
        file: location.file,
        explanation: pattern.explanation,
        suggestion: ERROR_SUGGESTIONS[pattern.category] || ERROR_SUGGESTIONS['未知错误'],
        raw: errorMsg
      };
    }
  }

  // No pattern matched - return generic error
  return {
    type: 'unknown',
    category: '未知错误',
    severity: 'error',
    message: errorMsg,
    details: [],
    line: location.line,
    column: location.column,
    file: location.file,
    explanation: '发生了未知类型的错误',
    suggestion: ERROR_SUGGESTIONS['未知错误'],
    raw: errorMsg
  };
};

// ============================================================================
// Multi-Error Parser (for compilation output with multiple errors)
// ============================================================================
export const parseMultipleErrors = (output) => {
  if (!output) return [];

  // Split by lines and group related errors
  const lines = output.split('\n');
  const errors = [];
  let currentError = '';
  let inErrorBlock = false;

  for (const line of lines) {
    // Check if this line starts an error
    const errorStart = line.match(/^([a-zA-Z_][a-zA-Z0-9_./\\-]*\.(?:cpp|cpp|h|hpp|c|cxx|cc))?(:?)(\d+)?(:?)(\d+)?:?\s*(error|warning|note):/i);

    if (errorStart) {
      // Save previous error if exists
      if (currentError.trim()) {
        errors.push(parseCppError(currentError.trim()));
      }
      currentError = line;
      inErrorBlock = true;
    } else if (inErrorBlock && (line.startsWith(' ') || line.startsWith('\t'))) {
      // Continuation of previous error
      currentError += `\n${line}`;
    } else if (inErrorBlock && line.trim()) {
      // New non-error line, check if it's a related note
      if (line.match(/^\s*note:/i)) {
        currentError += `\n${line}`;
      } else {
        // Save and start fresh
        errors.push(parseCppError(currentError.trim()));
        currentError = '';
        inErrorBlock = false;
      }
    }
  }

  // Don't forget the last error
  if (currentError.trim()) {
    errors.push(parseCppError(currentError.trim()));
  }

  return errors;
};

// ============================================================================
// Severity Colors
// ============================================================================
const SEVERITY_CONFIG = {
  error: {
    color: '#ff4d4f',
    bgColor: 'rgba(255, 77, 79, 0.1)',
    borderColor: '#ff4d4f',
    icon: <CloseCircleOutlined />,
    label: '错误'
  },
  warning: {
    color: '#faad14',
    bgColor: 'rgba(250, 173, 20, 0.1)',
    borderColor: '#faad14',
    icon: <WarningOutlined />,
    label: '警告'
  },
  info: {
    color: '#1890ff',
    bgColor: 'rgba(24, 144, 255, 0.1)',
    borderColor: '#1890ff',
    icon: <InfoCircleOutlined />,
    label: '提示'
  }
};

// ============================================================================
// Single Error Display Component
// ============================================================================
const SingleErrorDisplay = ({ error, expanded = false, onExpand }) => {
  const config = SEVERITY_CONFIG[error.severity] || SEVERITY_CONFIG.error;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(error.raw || error.message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      background: config.bgColor,
      border: `1px solid ${config.borderColor}`,
      borderRadius: 8,
      marginBottom: 12,
      overflow: 'hidden',
      transition: 'all 0.2s'
    }}>
      {/* Error Header */}
      <div style={{
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        borderBottom: expanded ? `1px solid ${config.borderColor}` : 'none'
      }}>
        <div style={{ color: config.color, fontSize: 18, marginTop: 2 }}>
          {config.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Tag color={config.color} style={{ margin: 0 }}>{config.label}</Tag>
            <Tag color="purple" style={{ margin: 0 }}>{error.category}</Tag>
            {error.file && (
              <Tag color="default" style={{ margin: 0 }}>
                <FileTextOutlined /> {error.file}
              </Tag>
            )}
            {error.line && (
              <Tag color="cyan" style={{ margin: 0 }}>
                第 {error.line} 行{error.column && `, 第 ${error.column} 列`}
              </Tag>
            )}
          </div>

          {/* Error message preview */}
          <div style={{
            marginTop: 8,
            color: '#d4d4d4',
            fontFamily: 'Consolas, Monaco, monospace',
            fontSize: 13,
            lineHeight: 1.5,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: expanded ? 'pre-wrap' : 'nowrap',
            maxHeight: expanded ? 'none' : 40
          }}>
            {error.message}
          </div>
        </div>

        <Space size={4}>
          <Button
            type="text"
            size="small"
            icon={copied ? <CheckCircleOutlined /> : <CopyOutlined />}
            onClick={handleCopy}
            style={{ color: copied ? '#52c41a' : '#888' }}
          />
          {error.suggestion?.length > 0 && (
            <Button
              type="text"
              size="small"
              onClick={onExpand}
              style={{ color: '#888' }}
            >
              {expanded ? '收起' : '详情'}
            </Button>
          )}
        </Space>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div style={{ padding: '0 16px 16px 46px' }}>
          {/* Explanation */}
          <div style={{
            background: '#1e1e1e',
            padding: 12,
            borderRadius: 6,
            marginBottom: 12
          }}>
            <div style={{ color: '#888', fontSize: 12, marginBottom: 4 }}>错误说明:</div>
            <div style={{ color: '#d4d4d4', fontSize: 13 }}>{error.explanation}</div>
          </div>

          {/* Suggestions */}
          <div style={{
            background: '#1e1e1e',
            padding: 12,
            borderRadius: 6
          }}>
            <div style={{ color: '#888', fontSize: 12, marginBottom: 8 }}>
              修复建议 ({error.suggestion?.length || 0} 条):
            </div>
            <ul style={{
              color: '#d4d4d4',
              margin: 0,
              paddingLeft: 20,
              fontSize: 13,
              lineHeight: 1.8
            }}>
              {error.suggestion?.map((s, i) => (
                <li key={i} style={{ marginBottom: 4 }}>{s}</li>
              ))}
            </ul>
          </div>

          {/* Raw error for advanced users */}
          {error.raw && error.raw !== error.message && (
            <details style={{ marginTop: 12 }}>
              <summary style={{
                color: '#888',
                cursor: 'pointer',
                fontSize: 12,
                userSelect: 'none'
              }}>
                查看原始错误信息
              </summary>
              <pre style={{
                background: '#1e1e1e',
                padding: 12,
                borderRadius: 6,
                marginTop: 8,
                color: '#ce9178',
                fontSize: 12,
                fontFamily: 'Consolas, Monaco, monospace',
                overflow: 'auto',
                maxHeight: 200,
                whiteSpace: 'pre-wrap'
              }}>
                {error.raw}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Main Error Display Component
// ============================================================================
const ErrorDisplay = ({ errors, showAll = false }) => {
  const [expandedIndex, setExpandedIndex] = useState(null);

  const errorList = useMemo(() => {
    if (!errors) return [];
    if (Array.isArray(errors)) {
      // Already parsed errors
      return errors.map(e => typeof e === 'string' ? parseCppError(e) : e);
    }
    // Raw string, parse it
    return parseMultipleErrors(errors);
  }, [errors]);

  if (errorList.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="没有错误信息"
        style={{ margin: '40px 0', color: '#888' }}
      />
    );
  }

  const errorCounts = errorList.reduce((acc, err) => {
    acc[err.severity] = (acc[err.severity] || 0) + 1;
    return acc;
  }, {});

  const displayErrors = showAll ? errorList : errorList.slice(0, 5);
  const remainingCount = errorList.length - displayErrors.length;

  return (
    <div style={{ padding: 16 }}>
      {/* Summary Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
        padding: '8px 12px',
        background: '#252526',
        borderRadius: 6
      }}>
        <BugOutlined style={{ color: '#ff4d4f', fontSize: 18 }} />
        <span style={{ color: '#fff', fontWeight: 500 }}>
          共发现 {errorList.length} 个问题
        </span>
        <Space size={8}>
          {errorCounts.error && (
            <Tag color="red">{errorCounts.error} 错误</Tag>
          )}
          {errorCounts.warning && (
            <Tag color="orange">{errorCounts.warning} 警告</Tag>
          )}
          {errorCounts.info && (
            <Tag color="blue">{errorCounts.info} 提示</Tag>
          )}
        </Space>
      </div>

      {/* Error List */}
      {displayErrors.map((error, index) => (
        <SingleErrorDisplay
          key={index}
          error={error}
          expanded={expandedIndex === index}
          onExpand={() => setExpandedIndex(expandedIndex === index ? null : index)}
        />
      ))}

      {/* Show More Button */}
      {remainingCount > 0 && !showAll && (
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <Button type="link" style={{ color: '#1890ff' }}>
            还有 {remainingCount} 个问题...
          </Button>
        </div>
      )}

      {/* Collapsible for detailed view */}
      {errorList.length > 1 && (
        <Collapse
          style={{ marginTop: 16 }}
          items={[{
            key: 'all',
            label: (
              <span style={{ color: '#d4d4d4' }}>
                查看所有 {errorList.length} 条原始错误信息
              </span>
            ),
            children: (
              <pre style={{
                background: '#1e1e1e',
                padding: 12,
                borderRadius: 6,
                color: '#ce9178',
                fontSize: 12,
                fontFamily: 'Consolas, Monaco, monospace',
                overflow: 'auto',
                maxHeight: 400,
                whiteSpace: 'pre-wrap',
                margin: 0
              }}>
                {errorList.map(e => e.raw).filter(Boolean).join('\n\n')}
              </pre>
            )
          }]}
        />
      )}
    </div>
  );
};

// ============================================================================
// Compact Error Summary (for inline display)
// ============================================================================
export const ErrorSummary = ({ errors }) => {
  const errorList = useMemo(() => {
    if (!errors) return [];
    if (Array.isArray(errors)) {
      return errors.map(e => typeof e === 'string' ? parseCppError(e) : e);
    }
    return parseMultipleErrors(errors);
  }, [errors]);

  if (errorList.length === 0) return null;

  const hasErrors = errorList.some(e => e.severity === 'error');
  const hasWarnings = errorList.some(e => e.severity === 'warning');

  return (
    <Space size={8}>
      {hasErrors && (
        <Tag color="red" icon={<CloseCircleOutlined />}>
          {errorList.filter(e => e.severity === 'error').length} 错误
        </Tag>
      )}
      {hasWarnings && (
        <Tag color="orange" icon={<WarningOutlined />}>
          {errorList.filter(e => e.severity === 'warning').length} 警告
        </Tag>
      )}
    </Space>
  );
};

// ============================================================================
// Export Components and Utilities
// ============================================================================
export {
  ErrorDisplay as default,
  parseCppError,
  parseMultipleErrors,
  ERROR_PATTERNS,
  ERROR_SUGGESTIONS
};