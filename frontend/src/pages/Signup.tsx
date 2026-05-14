import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';
import styles from './Signup.module.css';
import type { EntityID } from '../../../common/models';

function Signup() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);

    const [campus, setCampus] = useState('');
    const [studentId, setStudentId] = useState('');
    const [college, setCollege] = useState('');
    const [major, setMajor] = useState('');
    const [email, setEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [name, setName] = useState('');
    const [userid, setUserid] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [mailToken, setMailToken] = useState<string | null>(null);
    const [isEmailSent, setIsEmailSent] = useState(false);
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const nextStep = () => setStep((prev) => prev + 1);
    const prevStep = () => setStep((prev) => prev - 1);

    const handleSendCode = async () => {
        if (!email) return alert('이메일을 입력해주세요.');
        setIsLoading(true);
        try {
            const res = await authApi.sendMailCode(email);
            if (res.success) {
                setIsEmailSent(true);
                alert('인증코드가 발송되었습니다.');
            } else {
                alert(`발송 실패: ${res.e}`);
            }
        } catch (error) {
            alert('오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyCode = async () => {
        if (!verificationCode) return alert('인증코드를 입력해주세요.');
        setIsLoading(true);
        try {
            const res = await authApi.verifyMailCode(email, verificationCode);
            if (res.success) {
                setIsEmailVerified(true);
                setMailToken(res.token);
                alert('이메일 인증이 완료되었습니다.');
            } else {
                alert(`인증 실패: ${res.e}`);
            }
        } catch (error) {
            alert('오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== passwordConfirm) return alert('비밀번호가 일치하지 않습니다.');
        if (!mailToken) return alert('이메일 인증이 필요합니다.');

        // ID mapping for backend UUID requirements
        const campusMap: Record<string, EntityID<'campus'>> = {
            'seoul': '646566e0-d5b9-437e-95db-45c7d71a5783',
            'sejong': 'e730f6f3-c8aa-44c0-8469-9674765b6b44'
        };

        const collegeMap: Record<string, EntityID<'college'>> = {
            '정보대학': '35f63daa-0447-48d1-a66a-d21c796bb816'
        };

        const majorMap: Record<string, EntityID<'department'>> = {
            '컴퓨터학과': 'ce4ed2e7-0454-4694-bc76-63817dd2a9c9',
            '데이터과학과': '3dc282ed-cb8d-44e6-96ae-e420901400db',
            '인공지능학과': '81f3db42-e0da-4dd4-9d94-8dab8fc700ec'
        };

        setIsLoading(true);
        try {
            const res = await authApi.signup({
                campus: campus as any,
                college: collegeMap[college],
                department: majorMap[major],
                student_id: studentId,
                name,
                login_id: userid,
                password,
                univ_mail: {
                    address: email,
                    token: mailToken as any
                }
            });

            if (res.success) {
                alert('회원가입이 완료되었습니다!');
                navigate('/login');
            } else {
                alert(`회원가입 실패: ${res.e}`);
            }
        } catch (error) {
            alert('오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const collegeData = {
        '정보대학': ['컴퓨터학과', '데이터과학과', '인공지능학과']
    };

    return (
        <div className={styles['signup-container']}>
            <div className={styles['signup-card']}>
                {step > 1 && (
                    <button className={styles['back-btn']} onClick={prevStep} type="button">
                        &larr; 뒤로
                    </button>
                )}
                
                {step === 1 && (
                    <div className={`${styles['step-content']} ${styles['fade-in']}`}>
                        <h2 className={styles['signup-title']}>환영해요! <span>🎉</span></h2>
                        <p className={styles['signup-subtitle']}>재학중인 캠퍼스를 선택해 주세요</p>
                        
                        <div className={styles['campus-selection']}>
                            <button 
                                type="button"
                                className={`${styles['campus-btn']} ${campus === '646566e0-d5b9-437e-95db-45c7d71a5783' ? styles.selected : ''}`}
                                onClick={() => setCampus('646566e0-d5b9-437e-95db-45c7d71a5783')}
                            >
                                서울캠퍼스
                            </button>
                            <button 
                                type="button"
                                className={`${styles['campus-btn']} ${campus === 'e730f6f3-c8aa-44c0-8469-9674765b6b44' ? styles.selected : ''}`}
                                onClick={() => setCampus('e730f6f3-c8aa-44c0-8469-9674765b6b44')}
                            >
                                세종캠퍼스
                            </button>
                        </div>
                        
                        <button 
                            type="button"
                            className={`${styles.btn} ${styles['btn-primary']} ${styles['next-btn']}`} 
                            onClick={nextStep} 
                            disabled={!campus}
                        >
                            다음
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className={`${styles['step-content']} ${styles['fade-in']}`}>
                        <h2 className={styles['signup-title']}>학적 정보</h2>
                        <p className={styles['signup-subtitle']}>정확한 정보를 입력해 주세요</p>
                        
                        <div className={styles['form-group']}>
                            <label className={styles['form-label']}>이름</label>
                            <input 
                                type="text" 
                                className={styles['form-input']} 
                                placeholder="실명을 입력해 주세요" 
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div className={styles['form-group']}>
                            <label className={styles['form-label']}>학번</label>
                            <input 
                                type="text" 
                                className={styles['form-input']} 
                                placeholder="예: 2026123456" 
                                value={studentId}
                                onChange={(e) => setStudentId(e.target.value)}
                            />
                        </div>

                        <div className={styles['form-group']}>
                            <label className={styles['form-label']}>단과대학</label>
                            <select 
                                className={styles['form-select']} 
                                value={college} 
                                onChange={(e) => {
                                    setCollege(e.target.value);
                                    setMajor('');
                                }}
                            >
                                <option value="">단과대학을 선택하세요</option>
                                {Object.keys(collegeData).map(col => (
                                    <option key={col} value={col}>{col}</option>
                                ))}
                            </select>
                        </div>

                        {college && (
                            <div className={`${styles['form-group']} ${styles['slide-down']}`}>
                                <label className={styles['form-label']}>학과</label>
                                <select 
                                    className={styles['form-select']} 
                                    value={major} 
                                    onChange={(e) => setMajor(e.target.value)}
                                >
                                    <option value="">학과/학부를 선택하세요</option>
                                    {(collegeData as Record<string, string[]>)[college]?.map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <button 
                            type="button"
                            className={`${styles.btn} ${styles['btn-primary']} ${styles['next-btn']}`} 
                            onClick={nextStep}
                            disabled={!name || !studentId || !college || !major}
                        >
                            다음
                        </button>
                    </div>
                )}

                {step === 3 && (
                    <div className={`${styles['step-content']} ${styles['fade-in']}`}>
                        <h2 className={styles['signup-title']}>학교 인증</h2>
                        <p className={styles['signup-subtitle']}>안전한 이용을 위해 학교 이메일을 인증해 주세요</p>
                        
                        <div className={styles['form-group']}>
                            <label className={styles['form-label']}>학교 이메일</label>
                            <div className={styles['input-with-btn']}>
                                <input 
                                    type="email" 
                                    className={styles['form-input']} 
                                    placeholder="example@korea.ac.kr"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isEmailVerified}
                                />
                                <button 
                                    type="button" 
                                    className={styles['btn-outline']}
                                    onClick={handleSendCode}
                                    disabled={isLoading || isEmailVerified}
                                >
                                    {isEmailSent ? '재발송' : '인증번호 발송'}
                                </button>
                            </div>
                        </div>

                        <div className={styles['form-group']}>
                            <label className={styles['form-label']}>인증번호</label>
                            <div className={styles['input-with-btn']}>
                                <input 
                                    type="text" 
                                    className={styles['form-input']} 
                                    placeholder="인증번호 6자리 입력" 
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value)}
                                    disabled={isEmailVerified}
                                />
                                <button 
                                    type="button" 
                                    className={styles['btn-outline']}
                                    onClick={handleVerifyCode}
                                    disabled={isLoading || isEmailVerified || !isEmailSent}
                                >
                                    확인
                                </button>
                            </div>
                        </div>

                        <button 
                            type="button"
                            className={`${styles.btn} ${styles['btn-primary']} ${styles['next-btn']}`} 
                            onClick={nextStep}
                            disabled={!email || !verificationCode || !isEmailVerified || isLoading}
                        >
                            다음
                        </button>
                    </div>
                )}

                {step === 4 && (
                    <form className={`${styles['step-content']} ${styles['fade-in']}`} onSubmit={handleSignup}>
                        <h2 className={styles['signup-title']}>거의 다 되었어요! 🚀</h2>
                        <p className={styles['signup-subtitle']}>로그인에 사용할 정보를 설정해 주세요</p>
                        
                        <div className={styles['form-group']}>
                            <label className={styles['form-label']}>아이디</label>
                            <input 
                                type="text" 
                                className={styles['form-input']} 
                                placeholder="아이디를 입력하세요" 
                                value={userid}
                                onChange={(e) => setUserid(e.target.value)} 
                                required
                            />
                        </div>

                        <div className={styles['form-group']}>
                            <label className={styles['form-label']}>비밀번호</label>
                            <input 
                                type="password" 
                                className={styles['form-input']} 
                                placeholder="비밀번호를 입력하세요" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)} 
                                required
                            />
                        </div>

                        <div className={styles['form-group']}>
                            <label className={styles['form-label']}>비밀번호 확인</label>
                            <input 
                                type="password" 
                                className={styles['form-input']} 
                                placeholder="비밀번호를 한 번 더 입력하세요" 
                                value={passwordConfirm}
                                onChange={(e) => setPasswordConfirm(e.target.value)} 
                                required
                            />
                        </div>

                        <button type="submit" className={`${styles.btn} ${styles['btn-finish']}`}>
                            회원가입 완료
                        </button>
                    </form>
                )}
                
                <div className={styles['progress-container']}>
                    <div className={styles['progress-bar']} style={{ width: `${(step / 4) * 100}%` }}></div>
                </div>
            </div>
        </div>
    );
}

export default Signup;
