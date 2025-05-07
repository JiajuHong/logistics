import React, { useState, useEffect } from 'react';
import { Pagination, Select, Input, Button, Space } from 'antd';
import './index.less';

interface CustomPaginationProps {
  current: number;
  total: number;
  pageSize: number;
  onChange: (page: number, pageSize?: number) => void;
  onShowSizeChange: (current: number, size: number) => void;
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
  showTotal?: (total: number) => React.ReactNode;
  pageSizeOptions?: string[];
}

const CustomPagination: React.FC<CustomPaginationProps> = ({
  current,
  total,
  pageSize,
  onChange,
  onShowSizeChange,
  showSizeChanger = true,
  showQuickJumper = true,
  showTotal,
  pageSizeOptions = ['8', '16', '24', '32', '48'],
}) => {
  const [jumpPageNumber, setJumpPageNumber] = useState<string>('');
  
  // 检查初始化时确保有默认选中值
  useEffect(() => {
    // 确保pageSize在默认选项中
    if (!pageSizeOptions.includes(String(pageSize))) {
      console.log('页面大小不在默认选项中，重置为默认大小');
      onShowSizeChange(current, parseInt(pageSizeOptions[0], 10));
    }
  }, []);

  // 处理页码输入变化
  const handleJumpInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    if (value === '' || /^\d+$/.test(value)) {
      setJumpPageNumber(value);
    }
  };

  // 处理跳转
  const handleJumpToPage = () => {
    if (jumpPageNumber) {
      const pageNum = parseInt(jumpPageNumber, 10);
      // 确保页码在合理范围内
      if (pageNum > 0 && pageNum <= Math.ceil(total / pageSize)) {
        onChange(pageNum);
      }
      setJumpPageNumber('');
    }
  };

  // 计算总页数
  const totalPages = Math.ceil(total / pageSize);

  // 默认的显示总数方法
  const defaultShowTotal = (totalItems: number) => {
    return `共 ${totalItems} 条记录，共 ${totalPages} 页`;
  };

  // 处理分页器的变化
  const handleChange = (page: number, size?: number) => {
    console.log('分页器变化:', { page, size });
    onChange(page, size);
  };

  // 处理每页条数变化
  const handleShowSizeChange = (current: number, size: number) => {
    console.log('每页条数变化:', { current, size });
    onShowSizeChange(current, size);
  };

  return (
    <div className="custom-pagination">
      <Pagination
        current={current}
        total={total}
        pageSize={pageSize}
        onChange={handleChange}
        onShowSizeChange={handleShowSizeChange}
        showSizeChanger={showSizeChanger}
        showQuickJumper={false} // 禁用默认的快速跳转，使用自定义的
        showTotal={showTotal || defaultShowTotal}
        pageSizeOptions={pageSizeOptions}
      />
      {showQuickJumper && (
        <Space className="jump-to-page">
          <span>跳至</span>
          <Input
            className="page-input"
            value={jumpPageNumber}
            onChange={handleJumpInputChange}
            onPressEnter={handleJumpToPage}
            style={{ width: 50 }}
          />
          <span>页</span>
          <Button
            type="primary"
            size="small"
            onClick={handleJumpToPage}
            disabled={!jumpPageNumber}
          >
            确定
          </Button>
        </Space>
      )}
    </div>
  );
};

export default CustomPagination; 