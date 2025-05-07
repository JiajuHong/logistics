import { history } from '@umijs/max';
import { Button, Result } from 'antd';
import React from 'react';

const NoPermissionPage: React.FC = () => (
  <Result
    status="403"
    title="403 - 权限不足"
    subTitle="抱歉，您没有权限访问此页面"
    extra={
      <Button type="primary" onClick={() => history.push('/')}>
        返回首页
      </Button>
    }
  />
);

export default NoPermissionPage; 