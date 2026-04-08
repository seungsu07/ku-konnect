import styles from './MajorMap.module.css';

type TreeNodeData = {
  id: string;
  semester: string;
  title: string;
  subtitle: string;
  recommended?: boolean;
  children?: TreeNodeData[];
};

const treeData: TreeNodeData = {
  id: 'root',
  semester: '입학',
  title: '고려대학교 입학',
  subtitle: '공통 필수 교양과 학과 탐색',
  recommended: true,
  children: [
    {
      id: '1-1-A',
      semester: '1학년 1학기',
      title: '전공 기초 위주',
      subtitle: '빠른 전공 진입을 위한 전공 탐색',
      recommended: true,
      children: [
        {
          id: '1-2-A',
          semester: '1학년 2학기',
          title: '전공 핵심 진입',
          subtitle: '학점 우수자 테크트리',
          recommended: true,
          children: [
            {
              id: '2-1-A',
              semester: '2학년 1학기',
              title: '이중전공/심화전공 선택',
              subtitle: 'AI 맞춤: 데이터과학과 이중전공 추천',
              recommended: true,
              children: [
                {
                  id: '3-1-A',
                  semester: '3~4학년',
                  title: '실무 프로젝트 올인',
                  subtitle: '산학협력 및 인턴십 연계로 실무 경험 축적',
                  recommended: true,
                }
              ]
            },
            {
              id: '2-1-B',
              semester: '2학년 1학기',
              title: '학회 및 동아리 몰입',
              subtitle: '전공 외 네트워킹 강화 및 외부 활동',
            }
          ]
        },
        {
          id: '1-2-B',
          semester: '1학년 2학기',
          title: '교양 및 학점 보완',
          subtitle: '전공 적성 재탐색 루트 및 핵심교양 이수',
        }
      ]
    },
    {
      id: '1-1-B',
      semester: '1학년 1학기',
      title: '다양한 교양 수강',
      subtitle: '폭넓은 학문 탐색을 통한 적성 발굴',
      children: [
        {
          id: '1-2-C',
          semester: '1학년 2학기',
          title: '새로운 전공 교과 경험',
          subtitle: '다양한 분야의 기초 과목 수강',
        }
      ]
    }
  ]
};

const TreeNode = ({ node }: { node: TreeNodeData }) => {
  return (
    <li className={styles.li}>
      <div className={`${styles.card} ${node.recommended ? styles.recommended : ''}`}>
        {node.recommended && <div className={styles.glow}></div>}
        <span className={styles.tag}>{node.semester}</span>
        <h3 className={styles.nodeTitle}>{node.title}</h3>
        <p className={styles.nodeSubtitle}>{node.subtitle}</p>
      </div>
      {node.children && node.children.length > 0 && (
        <ul className={styles.ul}>
          {node.children.map(child => (
            <TreeNode key={child.id} node={child} />
          ))}
        </ul>
      )}
    </li>
  );
};

const MajorMap = () => {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>
                    <span className={styles.highlight}>AI 맞춤형</span> 전공 설계
                </h1>
                <p className={styles.subtitle}>
                    학생의 성향, 학점, 선호 트렌드를 바탕으로 최우수 선배들의 데이터를 학습해 가장 이상적인 커리큘럼 트리를 제안합니다.
                </p>
                
                <div className={styles.aiPanel}>
                    <div className={styles.aiIcon}>✨</div>
                    <div className={styles.aiText}>
                        <h4>AI 추천 경로가 활성화되었습니다</h4>
                        <p>학습 데이터를 기반으로 한 최적 루트를 빨간색으로 하이라이트하여 제시하고 있습니다.</p>
                    </div>
                </div>
            </div>

            <div className={styles.treeScroll}>
                <div className={styles.tree}>
                    <ul className={styles.ul}>
                        <TreeNode node={treeData} />
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default MajorMap;
