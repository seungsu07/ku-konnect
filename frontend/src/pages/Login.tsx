import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';
import logo from '../assets/logo.svg';
import styles from './Login.module.css';

function Login() {
    const navigate = useNavigate();
    const [id, setId] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await authApi.login({ id, password });
            if (res.success) {
                alert('로그인 성공!');
                // Store token/session if needed (assuming cookies or handled by backend)
                navigate('/');
            } else {
                alert(`로그인 실패: ${res.e}`);
            }
        } catch (error) {
            alert('오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignUp = () => {
        navigate('/signup');
    };

    const handleGoHome = () => {
        navigate('/');
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        containerRef.current.style.setProperty('--x', `${x}px`);
        containerRef.current.style.setProperty('--y', `${y}px`);
    };

    return (
        <div 
            className={styles['login-container']} 
            ref={containerRef}
            onMouseMove={handleMouseMove}
        >
            <div className={styles['interactive-bg']}></div>
            <div className={styles['login-card']}>
                <div className={styles['logo-container']}>
                    <img src={logo} alt="Logo" className={styles['login-logo']} />
                </div>
                <form onSubmit={handleLogin}>
                    <div className={styles['form-group']}>
                        <label className={styles['form-label']} htmlFor="userid">아이디</label>
                        <input
                            type="text"
                            id="userid"
                            className={styles['form-input']}
                            placeholder="아이디를 입력하세요"
                            value={id}
                            onChange={(e) => setId(e.target.value)}
                            required
                        />
                    </div>
                    <div className={styles['form-group']}>
                        <label className={styles['form-label']} htmlFor="password">비밀번호</label>
                        <input
                            type="password"
                            id="password"
                            className={styles['form-input']}
                            placeholder="비밀번호를 입력하세요"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    
                    <div className={styles['btn-container']}>
                        <button type="submit" className={`${styles.btn} ${styles['btn-primary']}`} disabled={isLoading}>
                            {isLoading ? '로그인 중...' : '로그인'}
                        </button>
                        <button 
                            type="button" 
                            className={`${styles.btn} ${styles['btn-secondary']}`} 
                            onClick={handleSignUp}
                            disabled={isLoading}
                        >
                            회원가입
                        </button>
                        <button 
                            type="button" 
                            className={`${styles.btn} ${styles['btn-secondary']}`} 
                            style={{ marginTop: '-8px', border: 'none', background: 'transparent', color: '#94a3b8', fontSize: '14px' }}
                            onClick={handleGoHome}
                        >
                            홈으로 돌아가기
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Login;