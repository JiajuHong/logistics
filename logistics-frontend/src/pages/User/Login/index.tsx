import Footer from '@/components/Footer';
import { getLoginUser, userLogin, userRegister } from '@/services/api';
import { LockOutlined, UserOutlined, SafetyOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { LoginFormPage, ProFormText, ProFormCheckbox } from '@ant-design/pro-components';
import { ProFormInstance } from '@ant-design/pro-form/lib';
import { useEmotionCss } from '@ant-design/use-emotion-css';
import { Helmet, history, useModel } from '@umijs/max';
import { message, Tabs, Progress, Tooltip, Typography, Space, Divider, Button } from 'antd';
import React, { useRef, useState, useEffect } from 'react';
import Settings from '../../../../config/defaultSettings';
import '@/pages/Welcome.less'; // Import the shared styles

const { Text, Link } = Typography;

type type = 'account' | 'register' | 'forgetPassword';

// Password strength calculation function
const calculatePasswordStrength = (password: string): number => {
  if (!password) return 0;

  let strength = 0;
  // Length check
  if (password.length >= 6) strength += 1;
  if (password.length >= 10) strength += 1;

  // Complexity check
  if (/[A-Z]/.test(password)) strength += 1; // Has uppercase
  if (/[a-z]/.test(password)) strength += 1; // Has lowercase
  if (/[0-9]/.test(password)) strength += 1; // Has number
  if (/[^A-Za-z0-9]/.test(password)) strength += 1; // Has special char

  // Calculate percentage (max 6 checks)
  return Math.min(100, Math.floor((strength / 6) * 100));
};

// Password strength indicator component
const PasswordStrengthIndicator = ({ strength }: { strength: number }) => {
  let status: "exception" | "normal" | "active" | "success" = "exception";
  let text = "弱";

  if (strength >= 70) {
    status = "success";
    text = "强";
  } else if (strength >= 40) {
    status = "normal";
    text = "中";
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text type="secondary" style={{ fontSize: 12 }}>密码强度:</Text>
        <Text style={{ fontSize: 12 }} type={strength >= 70 ? "success" : strength >= 40 ? "warning" : "danger"}>
          {text}
        </Text>
      </div>
      <Progress percent={strength} status={status} showInfo={false} size="small" />
    </div>
  );
};

const Login: React.FC = () => {
  const [type, setType] = useState<string>('account');
  const { initialState, setInitialState } = useModel('@@initialState');
  const formRef = useRef<ProFormInstance>();
  const [loginProcessing, setLoginProcessing] = useState<boolean>(false);
  const [passwordStrength, setPasswordStrength] = useState<number>(0);
  const [password, setPassword] = useState<string>('');

  const containerClassName = useEmotionCss(() => {
    return {
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'auto',
    };
  });

  let loginFailureCount = 0;
  let blockEndTime: number | undefined;

  const handleSubmit = async (values: API.UserRegisterRequest) => {
    const { userPassword, checkPassword } = values;
    const currentTime = Date.now();

    // 防止重复提交
    if (loginProcessing) {
      return;
    }

    if (loginFailureCount >= 3) {
      if (!blockEndTime) {
        blockEndTime = currentTime + 30 * 1000;
      }
      if (currentTime < blockEndTime) {
        message.error(
          `登录失败次数过多，请${Math.ceil((blockEndTime - currentTime) / 1000)}秒后再试`,
        );
        return;
      } else {
        loginFailureCount = 0;
        blockEndTime = undefined;
      }
    }
    if (checkPassword) {
      if (userPassword !== checkPassword) {
        message.error('两次输入密码不一致！');
        return;
      }
      try {
        // 注册
        await userRegister({
          ...values,
        });

        const defaultLoginSuccessMessage = '注册成功！';
        message.success(defaultLoginSuccessMessage);
        // 切换到登录
        setType('account');
        // 重置表单
        formRef.current?.resetFields();
      } catch (error: any) {
        const defaultLoginFailureMessage = `注册失败，${error.message}`;
        message.error(defaultLoginFailureMessage);
      }
    } else {
      try {
        setLoginProcessing(true);
        // 显示加载消息
        const loadingMessage = message.loading('正在登录...', 0);

        // 登录
        const loginRes = await userLogin({
          ...values,
        });

        // 登录成功后，给会话状态一些稳定的时间
        await new Promise(resolve => setTimeout(resolve, 300));

        // 登录成功后，立即获取用户详细信息以确保权限正确设置
        try {
          // 增加重试逻辑，最多尝试3次获取用户信息
          let retries = 0;
          let userInfoRes = null;

          while (!userInfoRes && retries < 3) {
            try {
              userInfoRes = await getLoginUser();
              console.log('获取用户信息成功', userInfoRes);
            } catch (error) {
              retries++;
              console.error(`获取用户信息失败，尝试次数: ${retries}`, error);
              if (retries >= 3) throw error;
              // 短暂延迟后重试
              await new Promise(resolve => setTimeout(resolve, 300));
            }
          }

          // 确保用户信息存在
          if (userInfoRes && userInfoRes.data) {
            // 保存已登录用户信息
            await setInitialState({
              ...initialState,
              currentUser: userInfoRes.data,
            });

            // 关闭加载消息
            loadingMessage();

            const defaultLoginSuccessMessage = '登录成功！';
            message.success(defaultLoginSuccessMessage);

            // 确保状态更新完成后再进行页面跳转
            await new Promise(resolve => setTimeout(resolve, 200));

            // 重定向逻辑
            const urlParams = new URL(window.location.href).searchParams;
            let redirectPath = urlParams.get('redirect') || '/welcome';

            // 检查用户角色和重定向路径，防止普通用户被重定向到管理页面
            if (redirectPath.startsWith('/admin') && userInfoRes.data.userRole !== 'admin') {
              // 如果用户不是管理员但尝试访问管理页面，则重定向到欢迎页
              console.log('普通用户尝试访问管理页面，重定向到欢迎页');
              redirectPath = '/welcome';
            }

            // 使用window.location来实现更可靠的跳转，避免React Router状态问题
            // 由于已经获取了用户信息并更新了状态，直接使用location.href
            // 避免使用history.push触发额外的路由守卫检查
            window.location.href = redirectPath;
            return;
          } else {
            loadingMessage();
            throw new Error('获取用户信息数据为空');
          }
        } catch (error) {
          loadingMessage();
          console.error('获取用户信息失败:', error);
          message.error('登录成功但获取用户信息失败，请刷新页面重试');

          // 使用登录接口返回的基本信息
          setInitialState({
            ...initialState,
            currentUser: loginRes.data,
          });

          // 确保状态更新完成后再进行页面跳转
          await new Promise(resolve => setTimeout(resolve, 200));
          window.location.href = '/welcome';
          return;
        }
      } catch (error: any) {
        const defaultLoginFailureMessage = `登录失败，${error.message}`;
        message.error(defaultLoginFailureMessage);
        loginFailureCount++;
      } finally {
        setLoginProcessing(false);
      }
    }
  };

  // 避免在登录页再次触发登录检查
  useEffect(() => {
    // 清除任何之前的登录消息
    message.destroy();
  }, []);

  return (
    <div
      className={containerClassName}
      style={{
        height: '100vh',
        background: 'linear-gradient(135deg, #e1f5fe 0%, #b3e5fc 25%, #81d4fa 50%, #4fc3f7 75%, #29b6f6 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Helmet>
        <title>
          {'登录'}- {Settings.title}
        </title>
      </Helmet>

      {/* Animated wave pattern at the bottom */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '20%',
        background: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 1200 120\' preserveAspectRatio=\'none\'%3E%3Cpath d=\'M0,0 C150,90 350,0 500,50 C650,100 700,0 850,40 C1000,80 1100,20 1200,80 L1200,120 L0,120 Z\' style=\'fill: %230277bd; opacity: 0.3\'%3E%3C/path%3E%3Cpath d=\'M0,70 C150,10 350,100 500,40 C650,0 700,100 850,60 C1000,20 1100,90 1200,30 L1200,120 L0,120 Z\' style=\'fill: %230288d1; opacity: 0.3\'%3E%3C/path%3E%3C/svg%3E")',
        backgroundSize: '100% 100%',
        zIndex: 0,
        opacity: 0.7,
      }} />

      {/* Modern logistics grid pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.1,
        background: `
          linear-gradient(rgba(3, 169, 244, 0.5) 1px, transparent 1px),
          linear-gradient(90deg, rgba(3, 169, 244, 0.5) 1px, transparent 1px)
        `,
        backgroundSize: '30px 30px',
        zIndex: 0,
      }} />

      {/* World map with shipping routes */}
      <div style={{
        position: 'absolute',
        top: '5%',
        left: '5%',
        width: '90%',
        height: '90%',
        opacity: 0.07,
        zIndex: 0,
        background: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 800 400\'%3E%3Cpath d=\'M100,200 C150,150 200,250 250,200 C300,150 350,100 400,150 C450,200 500,150 550,200 C600,250 650,200 700,150\' stroke=\'%230277bd\' stroke-width=\'3\' fill=\'none\' stroke-dasharray=\'10,5\'/%3E%3Cpath d=\'M150,100 C200,150 250,100 300,150 C350,200 400,250 450,200 C500,150 550,100 600,150 C650,200 700,250 750,200\' stroke=\'%230277bd\' stroke-width=\'3\' fill=\'none\' stroke-dasharray=\'10,5\'/%3E%3Cpath d=\'M100,300 C150,250 200,300 250,250 C300,200 350,250 400,300 C450,250 500,200 550,250 C600,300 650,250 700,300\' stroke=\'%230277bd\' stroke-width=\'3\' fill=\'none\' stroke-dasharray=\'10,5\'/%3E%3Ccircle cx=\'150\' cy=\'100\' r=\'8\' fill=\'%230277bd\'/%3E%3Ccircle cx=\'250\' cy=\'200\' r=\'8\' fill=\'%230277bd\'/%3E%3Ccircle cx=\'400\' cy=\'150\' r=\'8\' fill=\'%230277bd\'/%3E%3Ccircle cx=\'550\' cy=\'200\' r=\'8\' fill=\'%230277bd\'/%3E%3Ccircle cx=\'650\' cy=\'100\' r=\'8\' fill=\'%230277bd\'/%3E%3Ccircle cx=\'300\' cy=\'250\' r=\'8\' fill=\'%230277bd\'/%3E%3Ccircle cx=\'500\' cy=\'300\' r=\'8\' fill=\'%230277bd\'/%3E%3Ccircle cx=\'700\' cy=\'250\' r=\'8\' fill=\'%230277bd\'/%3E%3C/svg%3E")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }} />

      {/* Detailed logistics route lines */}
      <div style={{
        position: 'absolute',
        top: '5%',
        right: '5%',
        width: '35%',
        height: '40%',
        zIndex: 0,
        opacity: 0.25,
        background: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'300\' height=\'300\' viewBox=\'0 0 300 300\'%3E%3Cg fill=\'none\' stroke=\'%230050b3\' stroke-width=\'2\'%3E%3Ccircle cx=\'30\' cy=\'30\' r=\'6\'/%3E%3Ccircle cx=\'170\' cy=\'170\' r=\'6\'/%3E%3Ccircle cx=\'100\' cy=\'100\' r=\'6\'/%3E%3Ccircle cx=\'170\' cy=\'30\' r=\'6\'/%3E%3Ccircle cx=\'30\' cy=\'170\' r=\'6\'/%3E%3Ccircle cx=\'200\' cy=\'200\' r=\'6\'/%3E%3Ccircle cx=\'250\' cy=\'100\' r=\'6\'/%3E%3Ccircle cx=\'100\' cy=\'250\' r=\'6\'/%3E%3Cpath d=\'M30,30 L100,100 L170,30\'/%3E%3Cpath d=\'M30,170 L100,100 L170,170\' stroke-dasharray=\'5,5\'/%3E%3Cpath d=\'M100,100 L200,200\' stroke-dasharray=\'10,5\'/%3E%3Cpath d=\'M100,100 L250,100\' stroke-dasharray=\'5,5\'/%3E%3Cpath d=\'M100,100 L100,250\' stroke-dasharray=\'10,5\'/%3E%3C/g%3E%3C/svg%3E")',
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
      }} />

      {/* Large truck icon */}
      <div style={{
        position: 'absolute',
        bottom: '15%',
        left: '5%',
        width: '25%',
        height: '15%',
        opacity: 0.25,
        zIndex: 0,
        background: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'200\' height=\'100\' viewBox=\'0 0 200 100\'%3E%3Cpath d=\'M20,80 L20,40 L80,40 L100,20 L160,20 L160,80 L20,80 Z M40,80 L40,60 L60,60 L60,80 Z M140,80 L140,60 L160,60 L160,80 Z\' fill=\'%231890ff\'/%3E%3C/svg%3E")',
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
      }} />

      {/* Multiple package/box icons scattered throughout */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '10%',
        width: '20%',
        height: '20%',
        opacity: 0.2,
        zIndex: 0,
        background: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Cpath d=\'M10,80 L10,30 L50,10 L90,30 L90,80 L50,100 Z\' fill=\'none\' stroke=\'%231890ff\' stroke-width=\'2\'/%3E%3Cpath d=\'M10,30 L50,50 L90,30\' fill=\'none\' stroke=\'%231890ff\' stroke-width=\'2\'/%3E%3Cpath d=\'M50,50 L50,100\' fill=\'none\' stroke=\'%231890ff\' stroke-width=\'2\'/%3E%3C/svg%3E")',
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
      }} />

      <div style={{
        position: 'absolute',
        top: '45%',
        left: '25%',
        width: '15%',
        height: '15%',
        opacity: 0.2,
        zIndex: 0,
        background: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Cpath d=\'M20,80 L20,30 L50,10 L80,30 L80,80 L50,100 Z\' fill=\'none\' stroke=\'%230277bd\' stroke-width=\'2\'/%3E%3Cpath d=\'M20,30 L50,50 L80,30\' fill=\'none\' stroke=\'%230277bd\' stroke-width=\'2\'/%3E%3Cpath d=\'M50,50 L50,100\' fill=\'none\' stroke=\'%230277bd\' stroke-width=\'2\'/%3E%3Cpath d=\'M35,55 L65,55\' stroke=\'%230277bd\' stroke-width=\'2\'/%3E%3Cpath d=\'M35,65 L65,65\' stroke=\'%230277bd\' stroke-width=\'2\'/%3E%3C/svg%3E")',
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
      }} />

      <div style={{
        position: 'absolute',
        bottom: '30%',
        right: '25%',
        width: '18%',
        height: '18%',
        opacity: 0.2,
        zIndex: 0,
        background: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'120\' height=\'120\' viewBox=\'0 0 120 120\'%3E%3Crect x=\'20\' y=\'20\' width=\'80\' height=\'80\' fill=\'none\' stroke=\'%230277bd\' stroke-width=\'2\'/%3E%3Cpath d=\'M30,30 L90,30 M30,40 L90,40 M30,50 L90,50 M30,60 L90,60 M30,70 L90,70 M30,80 L90,80 M30,90 L90,90\' stroke=\'%230277bd\' stroke-width=\'1\' stroke-dasharray=\'5,3\'/%3E%3C/svg%3E")',
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
      }} />

      {/* Connecting paths for the route network */}
      <div style={{
        position: 'absolute',
        bottom: '20%',
        right: '15%',
        width: '30%',
        height: '30%',
        opacity: 0.15,
        zIndex: 0,
        background: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'300\' height=\'300\' viewBox=\'0 0 300 300\'%3E%3Cpath d=\'M50,50 L150,150 L250,50 M50,250 L150,150 L250,250 M50,50 L50,250 M250,50 L250,250\' stroke=\'%230050b3\' stroke-width=\'4\' fill=\'none\'/%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'8\' fill=\'%230050b3\'/%3E%3Ccircle cx=\'250\' cy=\'50\' r=\'8\' fill=\'%230050b3\'/%3E%3Ccircle cx=\'50\' cy=\'250\' r=\'8\' fill=\'%230050b3\'/%3E%3Ccircle cx=\'250\' cy=\'250\' r=\'8\' fill=\'%230050b3\'/%3E%3Ccircle cx=\'150\' cy=\'150\' r=\'12\' fill=\'%231890ff\'/%3E%3C/svg%3E")',
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
      }} />

      {/* Logistics flow chart */}
      <div style={{
        position: 'absolute',
        top: '60%',
        left: '15%',
        width: '25%',
        height: '20%',
        opacity: 0.2,
        zIndex: 0,
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
      }} />

      {/* Floating small icons - container ships, planes, trains */}
      <div style={{
        position: 'absolute',
        top: '45%',
        right: '40%',
        width: '10%',
        height: '10%',
        opacity: 0.2,
        zIndex: 0,
        background: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'50\' viewBox=\'0 0 100 50\'%3E%3Cpath d=\'M10,30 L90,30 L90,40 L10,40 Z M20,30 L20,20 L40,20 L40,30 M50,30 L50,15 L80,15 L80,30\' stroke=\'%230277bd\' stroke-width=\'2\' fill=\'none\'/%3E%3C/svg%3E")',
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
      }} />

      <div style={{
        position: 'absolute',
        top: '15%',
        left: '40%',
        width: '8%',
        height: '8%',
        opacity: 0.2,
        zIndex: 0,
        background: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Cpath d=\'M20,50 L80,50 M20,60 C30,60 30,40 40,40 C50,40 50,60 60,60 C70,60 70,40 80,40\' stroke=\'%230277bd\' stroke-width=\'2\' fill=\'none\'/%3E%3C/svg%3E")',
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
      }} />

      <div
        style={{
          flex: '1',
          padding: '32px 0',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <LoginFormPage
          formRef={formRef}
          logo={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img alt="logo" style={{ height: '44px', width: 'auto', objectFit: 'contain', marginRight: '10px' }} src="/logo.png" />
            </div>
          }
          title="区域物流调度中心"
          subTitle={<Typography.Text style={{ color: 'rgba(0, 0, 0, 0.65)' }}>高效、智能的物流调度解决方案</Typography.Text>}
          containerStyle={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(236, 246, 253, 0.95) 50%, rgba(224, 242, 254, 0.9) 100%)',
            backdropFilter: 'blur(15px)',
            boxShadow: '0 15px 40px rgba(3, 169, 244, 0.2)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.8)',
            width: '420px',
            maxWidth: '95%',
            padding: '8px',
          }}
          actions={
            <div style={{ textAlign: 'center', marginTop: '16px', color: 'rgba(0, 0, 0, 0.45)' }}>
              安全登录 · 专业服务
            </div>
          }
          initialValues={{
            autoLogin: true,
          }}
          submitter={{
            searchConfig: {
              submitText: type === 'account' ? '登录' : '注册',
            },
            submitButtonProps: {
              style: {
                width: '100%',
                background: 'linear-gradient(135deg, #29b6f6 0%, #0288d1 100%)',
                border: 'none',
                height: '40px',
                fontSize: '16px',
                marginTop: '16px',
                boxShadow: '0 8px 16px rgba(3, 169, 244, 0.25)',
              }
            }
          }}
          onFinish={async (values) => {
            await handleSubmit(values as API.UserRegisterRequest);
          }}
          style={{
            padding: '0 32px 32px'
          }}
        >
          {
            <Tabs 
              centered 
              activeKey={type} 
              onChange={(activeKey) => setType(activeKey as type)}
              style={{ 
                marginBottom: '8px' 
              }}
              tabBarStyle={{ 
                color: 'rgba(3, 169, 244, 0.65)',
                borderBottom: '1px solid rgba(3, 169, 244, 0.1)' 
              }}
            >
              <Tabs.TabPane key={'account'} tab={'登录'} />
              <Tabs.TabPane key={'register'} tab={'注册'} />
            </Tabs>
          }
          <div style={{ padding: '0 24px' }}>
            {type === 'account' && (
              <>
                <ProFormText
                  name="userAccount"
                  fieldProps={{
                    size: 'large',
                    prefix: <UserOutlined />,
                    style: {
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      border: '1px solid rgba(3, 169, 244, 0.2)',
                      borderRadius: '8px'
                    }
                  }}
                  placeholder={'请输入账号'}
                  rules={[
                    {
                      required: true,
                      message: '账号是必填项！',
                    },
                  ]}
                />
                <ProFormText.Password
                  name="userPassword"
                  fieldProps={{
                    size: 'large',
                    prefix: <LockOutlined />,
                    style: {
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      border: '1px solid rgba(3, 169, 244, 0.2)',
                      borderRadius: '8px'
                    }
                  }}
                  placeholder={'请输入密码'}
                  rules={[
                    {
                      required: true,
                      message: '密码是必填项！',
                    },
                  ]}
                />
                <div
                  style={{
                    marginBottom: 24,
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <ProFormCheckbox noStyle name="autoLogin">
                    记住我
                  </ProFormCheckbox>
                  <Link
                    style={{
                      float: 'right',
                    }}
                    onClick={() => {
                      message.info('请联系系统管理员重置密码');
                    }}
                  >
                    忘记密码
                  </Link>
                </div>
              </>
            )}
            {type === 'register' && (
              <>
                <ProFormText
                  name="userAccount"
                  fieldProps={{
                    size: 'large',
                    prefix: <UserOutlined />,
                    style: {
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      border: '1px solid rgba(3, 169, 244, 0.2)',
                      borderRadius: '8px'
                    }
                  }}
                  placeholder={'请设置账号'}
                  rules={[
                    {
                      required: true,
                      message: '账号是必填项！',
                    },
                    {
                      min: 4,
                      message: '账号长度至少为4位！',
                    },
                  ]}
                />
                <ProFormText.Password
                  name="userPassword"
                  fieldProps={{
                    size: 'large',
                    prefix: <LockOutlined />,
                    onChange: (e) => {
                      const newPassword = e.target.value;
                      setPassword(newPassword);
                      setPasswordStrength(calculatePasswordStrength(newPassword));
                    },
                    style: {
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      border: '1px solid rgba(3, 169, 244, 0.2)',
                      borderRadius: '8px'
                    }
                  }}
                  placeholder={'请设置密码'}
                  rules={[
                    {
                      required: true,
                      message: '密码是必填项！',
                    },
                    {
                      min: 6,
                      message: '密码长度至少为6位！',
                    },
                  ]}
                />
                {password && <PasswordStrengthIndicator strength={passwordStrength} />}
                <ProFormText.Password
                  name="checkPassword"
                  fieldProps={{
                    size: 'large',
                    prefix: <SafetyOutlined />,
                    style: {
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      border: '1px solid rgba(3, 169, 244, 0.2)',
                      borderRadius: '8px'
                    }
                  }}
                  placeholder={'请确认密码'}
                  rules={[
                    {
                      required: true,
                      message: '确认密码是必填项！',
                    },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('userPassword') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('两次输入的密码不一致！'));
                      },
                    }),
                  ]}
                />
                <div style={{ marginBottom: 24 }}>
                  <Space align="center">
                    <QuestionCircleOutlined />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      密码至少6位，建议包含字母、数字和特殊字符
                    </Text>
                  </Space>
                </div>
              </>
            )}
            <div style={{ margin: '16px 0' }}>
              {/* Custom gradient divider */}
              <div style={{
                height: '2px',
                background: 'linear-gradient(to right, rgba(3, 169, 244, 0.2), rgba(3, 169, 244, 0.8), rgba(3, 169, 244, 0.2))',
              }} />
            </div>
          </div>
        </LoginFormPage>
      </div>
      <Footer />
    </div>
  );
};

export default Login;
