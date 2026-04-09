import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Signup.module.css';

function Signup() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);

    const [campus, setCampus] = useState('');
    const [studentId, setStudentId] = useState('');
    const [college, setCollege] = useState('');
    const [major, setMajor] = useState('');
    const [email, setEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [userid, setUserid] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');

    const nextStep = () => setStep((prev) => prev + 1);
    const prevStep = () => setStep((prev) => prev - 1);

    const handleSignup = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Signup complete", { campus, studentId, college, major, email, userid });
        navigate('/login');
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
                                className={`${styles['campus-btn']} ${campus === 'seoul' ? styles.selected : ''}`}
                                onClick={() => setCampus('seoul')}
                            >
                                서울캠퍼스
                            </button>
                            <button 
                                type="button"
                                className={`${styles['campus-btn']} ${campus === 'sejong' ? styles.selected : ''}`}
                                onClick={() => setCampus('sejong')}
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
                            disabled={!studentId || !college || !major}
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
                                />
                                <button type="button" className={styles['btn-outline']}>인증번호 발송</button>
                            </div>
                        </div>

                        <div className={styles['form-group']}>
                            <label className={styles['form-label']}>인증번호</label>
                            <input 
                                type="text" 
                                className={styles['form-input']} 
                                placeholder="인증번호 6자리 입력" 
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                            />
                        </div>

                        <button 
                            type="button"
                            className={`${styles.btn} ${styles['btn-primary']} ${styles['next-btn']}`} 
                            onClick={nextStep}
                            disabled={!email || !verificationCode}
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
