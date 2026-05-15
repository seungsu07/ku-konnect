/** @import { RoadMapCourse } from '../../common/models' */
import {
  GoogleGenAI,
  Type,
  ThinkingLevel
} from '@google/genai';

/**
 * @param {string} input
 * @returns {Promise<RoadMapCourse[]>}
 */
export async function generate(input) {
  const ai = new GoogleGenAI({
    apiKey: process.env['LLM_KEY']
  });
  const tools = [
    {
      googleSearch: {
      }
    },
  ];
  const config = {
    thinkingConfig: {
      thinkingLevel: ThinkingLevel.MINIMAL,
    },
    tools,
    responseMimeType: 'application/json',
    responseSchema: {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            required: ["name", "score", "reason", "LimitOff", "code"],
            properties: {
                name: {
                    type: Type.STRING,
                },
                score: {
                    type: Type.INTEGER,
                },
                reason: {
                    type: Type.STRING,
                },
                limitoff: {
                    type: Type.BOOLEAN,
                },
                code: {
                    type: Type.STRING,
                },
            },
        },
    },
    systemInstruction: [
        {
          text: `You are an Academic Advising Agent assisting university students with designing their major roadmaps. 

Based on the user's input, analyze the curriculum tree and select the top 10 most highly recommended courses for the user. 

[Selection Rules]
1. Exclude Mandatory Courses: Do NOT include any courses where the major requirement status is '0' or '3'. These are strictly mandatory courses that the student must take anyway, so they should not take up the 10 recommendation slots.
2. Consider Offering Frequency: When determining the importance \`score\`, you must carefully consider the course's offering frequency over the last 5 years. Courses with a low offering frequency should be penalized or excluded from the selection.

[Output Format]
Output the 10 selected courses. Each course object must include the following keys:
- "name": The name of the course (String).
- "code": The course code (String).
- "score": The importance score, represented as an integer between 0 and 100 (Number).
- "reason": A concise explanation of why this course was selected based on the user's input (String).
- "limitoff": A boolean value (\`true\` or \`false\`) indicating whether to bypass standard prerequisite restrictions. Set this to \`true\` ONLY IF the user's input demonstrates strong prior knowledge, sufficient skills, or highly ambitious goals (e.g., early graduation). If \`true\`, it means the student is permitted to take this course ignoring the prerequisite tree.


CSV FIle:

과목명,학년,학기,과목코드,선이수과목,5년간 개설횟수,전공필수 여부
계산이론,2,1,COSE215,,5,4
공학수학,2,1,COSE281,전산수학2,5,4
이산수학,2,2,COSE211,계산이론,5,4
회로이론,2,1,COSE283,,1,4
프로그래밍언어,2,2,COSE212,"컴퓨터프로그래밍2, 계산이론",4,4
논리설계,2,2,COSE221,계산이론,5,4
데이터통신,2,2,COSE242,,5,4
전자기학,2,2,COSE284,"공학수학, 회로이론",4,4
디자인사고,3,1,DATA306,,0,6
컴퓨터시스템설계,3,1,COSE321,,3,4
컴퓨터그래픽스,3,1,COSE331,,3,4
정보보호,3,1,COSE354,,5,4
정보와정보학,3,1,COSE363,,2,4
데이터베이스,3,1,COSE371,알고리즘,5,4
데이터베이스시스템,3,1,COSE372,,3,4
디지털신호처리,3,1,COSE380,,3,4
확률및랜덤과정,3,1,COSE382,,5,4
신호및시스템,3,1,COSE385,공학수학,2,4
기업가정신과리더쉽,3,1,COSE389,,5,4
정보검색,3,1,COSE472,,0,4
고급기계학습,3,1,DATA303,,0,6
빅데이터분석,3,1,DATA304,,0,6
컴파일러,3,2,COSE312,,2,4
시스템프로그래밍,3,2,COSE322,,3,4
소프트웨어공학,3,2,COSE352,,5,4
기계학습,3,2,COSE362,,5,4
창의적소프트웨어창업방법론,3,2,COSE394,,5,4
시계열분석,3,2,SATA302,,0,6
비모통계수학,3,2,SATA332,,0,6
베이즈통계입문,3,2,SATA404,,0,6
기초컴퓨터비전이론및응용,3,2,DATA302,,0,6
블록체인입문및실습,4,1,COSE425,,0,4
고급딥러닝,4,1,COSE475,,0,4
데이터시각화,4,1,DATA401,,0,6
현장실습및창업실습1,4,1,COSE394-1,,5,4
현장실습및창업실습2,4,1,COSE394-2,,5,4
현장실습및창업실습3,4,1,COSE394-3,,5,4
현장실습및창업실습4,4,1,COSE394-4,,5,4
컴퓨터학콜로키움,4,1,COSE405,,3,4
저전력컴퓨팅,4,1,COSE415,,2,4
소프트웨어검증,4,1,COSE419,,1,4
임베디드시스템,4,1,COSE421,논리설계,3,4
블록최적화입문,4,1,COSE423,,3,4
게임프로그래밍,4,1,COSE434,,2,4
소프트웨어보안,4,1,COSE451,,3,4
스타트업프로젝트관리,4,1,COSE455,,3,4
자연어처리,4,1,COSE461,인공지능,4,4
데이터과학,4,1,COSE471,알고리즘,3,4
산학캡스톤디자인,4,1,COSE480,,2,4
무선회로설계,4,1,COSE483,,1,4
정보이론과추론학습,4,1,COSE485,,3,4
개별연구프로젝트,4,2,COSE407,,2,4
인공지능과자율주행자동차,4,2,COSE416,,1,4
인간컴퓨터상호작용입문,4,2,COSE432,,5,4
인터렉티브시각화,4,2,COSE436,,5,4
인터넷프로토콜,4,2,COSE441,데이터통신,3,4
클라우드컴퓨팅,4,2,COSE444,,5,4
모바일네트워크,4,2,COSE446,,0,4
실전SW프로젝트,4,2,COSE457,,2,4
딥러닝,4,2,COSE474,,5,4
무선보안,4,2,COSE484,,3,4
전산학특강,4,2,COSE490,,5,4
강화학습,4,2,DATA403,,0,6`,
        }
    ],
  };
  const model = 'gemini-3.1-flash-lite';
  const contents = [
    {
      role: 'user',
      parts: [
        {
          text: `${input}`,
        },
      ],
    },
  ];

  const response = await ai.models.generateContentStream({
    model,
    config,
    contents,
  });
  let txt = '';
  for await (const chunk of response) {
    txt += chunk.text?? '';
  }
  return JSON.parse(txt);
}