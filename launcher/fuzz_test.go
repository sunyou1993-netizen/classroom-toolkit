package main

import (
	"encoding/json"
	"strings"
	"testing"
)

// 선생님이 교가.txt 에 넣을 법한 온갖 경우를 넣어 봅니다.
// 어떤 입력이 와도 (가) 프로그램이 죽지 않고 (나) 화면 파일이 깨지지 않아야 합니다.
func TestSongOddInputs(t *testing.T) {
	cases := []struct {
		이름  string
		글   string
		되어야 bool // true = 교가가 켜져야 함
	}{
		{"빈 파일", "", false},
		{"주석만", "# 아무것도 없음\n# 두 줄", false},
		{"학교이름만", "학교이름: 가나초등학교", false},
		{"가사만", "1절\n가나다라 마바사", false},
		{"정상", "학교이름: 가나초\n1절\n가나다라 [마바]사", true},
		{"공백 섞인 키", "학교이름 :  가나초 \n1절\n가나다라 [마바]사", true},
		{"절 표시 없음", "학교이름: 가나초\n가나다라 [마바]사\n아자차카 [타파]하", true},
		{"절 여러 개", "학교이름: 가나초\n1절\n가나다라 [마바]사\n2절\n아자차카 [타파]하\n3절\n하하하하 [호호]히", true},
		{"윈도우 줄바꿈", "학교이름: 가나초\r\n1절\r\n가나다라 [마바]사\r\n", true},
		{"한 글자 줄", "학교이름: 가나초\n1절\n가", false},
		{"두 글자 줄", "학교이름: 가나초\n1절\n가나", true},
		{"공백만 있는 줄", "학교이름: 가나초\n1절\n가 나 다 라", false},
		{"대괄호 여러 개", "학교이름: 가나초\n1절\n[가나]다라 [마바]사", true},
		{"대괄호 한 글자", "학교이름: 가나초\n1절\n[가]나다라마", true},
		{"대괄호 세 글자", "학교이름: 가나초\n1절\n[가나다]라마바", true},
		{"영문 가사", "학교이름: Global School\n1절\nWe are the best school", true},
		{"숫자와 기호", "학교이름: 가나초\n1절\n1234 5678 !@#$", true},
		{"아주 긴 줄", "학교이름: 가나초\n1절\n" + strings.Repeat("가나", 2000), true},
		{"절이 아주 많음", "학교이름: 가나초\n" + strings.Repeat("1절\n가나다라 [마바]사\n", 200), true},
		{"따옴표", `학교이름: "가나"초등학교` + "\n후렴: 그는 \"안녕\" 이라 했다\n1절\n가나다라 [마바]사", true},
		{"역슬래시", `학교이름: 가나\초` + "\n1절\n가나다라 [마바]사", true},
		{"스크립트 태그", "학교이름: </script><script>alert(1)</script>\n1절\n가나다라 [마바]사", true},
		{"자바스크립트 끊기", "학교이름: a\",verses:[],x:\"\n1절\n가나다라 [마바]사", true},
		{"이모지", "학교이름: 가나초 🎵\n1절\n가나다라 [마바]사 🌸", true},
		{"줄바꿈 문자 글자로", "학교이름: 가나\\n초\n1절\n가나다라 [마바]사", true},
		{"탭", "학교이름:\t가나초\n1절\n가나다라 [마바]사", true},
	}

	bundle := `x={schoolName:"우리 학교",verses:[{"a":1}]};y='<span class="refrain-text">"옛 후렴"</span>'`

	for _, c := range cases {
		t.Run(c.이름, func(t *testing.T) {
			s, err := parseSongText(c.글)
			if c.되어야 && err != nil {
				t.Fatalf("켜져야 하는데 실패: %v", err)
			}
			if !c.되어야 {
				if err == nil {
					t.Fatalf("꺼져야 하는데 통과함: %+v", s)
				}
				return
			}
			song = s
			defer func() { song = nil }()

			out := string(patchSongBundle([]byte(bundle)))

			// (1) 자바스크립트가 깨지지 않았는지 — verses 를 다시 읽을 수 있어야 합니다.
			//     학교 이름 안에 "verses:" 같은 글자가 들어 있을 수 있으므로,
			//     schoolName 문자열을 먼저 건너뛴 뒤에 찾습니다.
			after := skipJSString(out, strings.Index(out, "schoolName:")+len("schoolName:"))
			i := strings.Index(out[after:], "verses:")
			if i < 0 {
				t.Fatal("verses 가 사라졌습니다")
			}
			i += after
			j := matchBracket(out, i+len("verses:"), '[', ']')
			if j < 0 {
				t.Fatal("verses 배열의 끝을 찾지 못했습니다")
			}
			var v []songVerse
			if e := json.Unmarshal([]byte(out[i+len("verses:"):j]), &v); e != nil {
				t.Fatalf("verses 가 올바른 JSON 이 아닙니다: %v", e)
			}
			if len(v) == 0 {
				t.Fatal("절이 하나도 없습니다")
			}

			// (2) 학교 이름도 다시 읽을 수 있어야 합니다.
			var name string
			end := strings.Index(out, "schoolName:") + len("schoolName:")
			if e := json.Unmarshal([]byte(out[end:after]), &name); e != nil {
				t.Fatalf("schoolName 이 올바른 JSON 이 아닙니다: %v", e)
			}

			// (3) 후렴이 span 을 깨뜨리지 않았는지
			m := refrainRe.FindString(out)
			if m == "" {
				t.Fatal("후렴 span 이 깨졌습니다")
			}
			if strings.Count(m, `"`) != 4 { // class="..." 2개 + 후렴 감싸는 2개
				t.Fatalf("후렴 안의 따옴표가 span 을 깨뜨립니다: %s", m)
			}

			// (4) 빈칸 글자가 실제 가사 안에 있어야 합니다
			for _, vv := range v {
				for _, l := range vv.Lines {
					for _, a := range l.Answers {
						if !strings.Contains(l.FullText, a) {
							t.Errorf("빈칸 %q 가 «%s» 안에 없습니다", a, l.FullText)
						}
					}
					if len(l.Answers) != 2 {
						t.Errorf("빈칸이 2개가 아닙니다: %v", l.Answers)
					}
				}
				for _, l := range vv.Lines {
					for _, a := range l.Answers {
						found := false
						for _, tile := range vv.KeypadTiles {
							if tile == a {
								found = true
							}
						}
						if !found {
							t.Errorf("정답 %q 가 타일에 없습니다", a)
						}
					}
				}
			}
		})
	}
}

// 아주 큰 파일이 와도 버텨야 합니다.
func TestHugeSongFile(t *testing.T) {
	big := "학교이름: 가나초\n1절\n" + strings.Repeat("가나다라 [마바]사\n", 20000)
	s, err := parseSongText(big)
	if err != nil {
		t.Fatal(err)
	}
	v := s.toVerses()
	if len(v) != 1 || len(v[0].Lines) != 20000 {
		t.Fatalf("줄 수가 이상합니다: %d", len(v[0].Lines))
	}
}

// 다른 파일은 절대 건드리면 안 됩니다.
func TestDoesNotTouchOtherFiles(t *testing.T) {
	song = nil
	untouched := []string{
		"timer/app.html", "paint/index.html", "quiz/proverb/assets/index-x.js",
		"quiz/environment/app.html", "index.html", "app.html",
		"quiz/song/assets/style.css", "quiz/fonts/fonts.css",
		"instruments/assets/piano.js", "quiz/index.html",
	}
	body := []byte(`<html><head></head><body>{id:"school"}schoolName:"x"</body></html>`)
	for _, n := range untouched {
		if string(applySchoolSong(n, body)) != string(body) {
			t.Errorf("건드리면 안 되는 파일이 바뀌었습니다: %s", n)
		}
	}
}

// 따옴표 문자열 하나를 건너뛰고 그 다음 자리를 돌려줍니다.
func skipJSString(s string, from int) int {
	if from >= len(s) || s[from] != '"' {
		return from
	}
	for i := from + 1; i < len(s); i++ {
		if s[i] == '\\' {
			i++
		} else if s[i] == '"' {
			return i + 1
		}
	}
	return len(s)
}
