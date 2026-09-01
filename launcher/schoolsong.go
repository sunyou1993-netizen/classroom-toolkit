// 교가를 학교마다 다르게 넣기 위한 부분입니다.
//
// 왜 이렇게 하나:
//   교가는 학교마다 다르고, 가사에는 작사·작곡가의 저작권이 있습니다.
//   그래서 교가를 exe 안에 넣지 않습니다. exe 는 모든 학교가 똑같은 것을 쓰고,
//   교가만 exe 옆에 놓인 작은 글 파일 하나로 정합니다.
//
//   수업도우미.exe        ← 모든 학교가 같은 파일
//   교가.txt              ← 학교마다 다른 파일 (없으면 교가 퀴즈가 아예 안 보입니다)
//
//   프로그램이 켜질 때 옆의 교가.txt 를 읽어, 화면으로 내보낼 때만 갈아 끼웁니다.
//   exe 파일 자체는 건드리지 않습니다. 그래서 교가를 바꾸려면 이 글 파일만 고치고
//   프로그램을 껐다 켜면 됩니다.
//
// 교가.txt 모양 (자세한 설명은 만들어지는 '교가-예시.txt' 안에 있습니다):
//
//   학교이름: 서울신답초등학교
//   후렴: 아 빛내자 우리 학교 서울 신답초등학교
//
//   1절
//   새싹이 무럭무럭 [자라]나듯이
//   오늘도 무럭무럭 자라는 [우리]
//
// 대괄호 [ ] 로 감싼 두 글자가 아이가 맞히는 빈칸이 됩니다.

package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path"
	"path/filepath"
	"regexp"
	"strings"
	"time"
	"unicode/utf16"
	"unicode/utf8"
)

/* ── 읽어 들인 교가 ──────────────────────────────────────── */

type schoolSong struct {
	SchoolName string
	Refrain    string
	Verses     [][]string // 절 → 줄
}

// 지금 켜져 있는 교가. nil 이면 교가 퀴즈를 통째로 숨깁니다.
var song *schoolSong

// 교가.txt 를 읽다 생긴 문제. 선생님이 볼 수 있게 파일로 남깁니다.
var songNote string

/* ── 파일 찾아 읽기 ─────────────────────────────────────── */

// exe 가 놓인 폴더에서 교가 파일을 찾습니다.
// 이름은 '교가.txt' 를 씁니다. 한글 파일 이름이 깨지는 환경을 대비해
// 'school-song.txt' 도 같이 받습니다.
var songFileNames = []string{"교가.txt", "school-song.txt"}

func loadSchoolSong() {
	dir := exeDir()
	if dir == "" {
		return
	}
	var raw []byte
	var found string
	for _, n := range songFileNames {
		b, err := os.ReadFile(filepath.Join(dir, n))
		if err == nil {
			raw, found = b, n
			break
		}
	}

	// 처음 쓰는 사람을 위해 예시 파일을 옆에 만들어 둡니다.
	// (USB 처럼 쓰기가 막힌 곳이면 조용히 넘어갑니다.)
	writeSampleSong(dir)

	if found == "" {
		songNote = "교가.txt 가 없어 교가 퀴즈를 숨겼습니다.\n" +
			"옆에 만들어 둔 '교가-예시.txt' 를 '교가.txt' 로 이름만 바꾸고\n" +
			"우리 학교 가사로 고치면 교가 퀴즈가 나타납니다."
		writeSongNote(dir)
		return
	}

	text, err := decodeText(raw)
	if err != nil {
		songNote = found + " 을 읽지 못했습니다: " + err.Error() + "\n" +
			"메모장에서 '다른 이름으로 저장'을 누르고, 아래쪽 '인코딩'을\n" +
			"'UTF-8' 로 바꿔서 저장해 주세요. 그동안 교가 퀴즈는 숨깁니다."
		writeSongNote(dir)
		return
	}

	s, err := parseSongText(text)
	if err != nil {
		songNote = found + " 의 내용에 문제가 있습니다: " + err.Error() + "\n" +
			"'교가-예시.txt' 와 견주어 보세요. 그동안 교가 퀴즈는 숨깁니다."
		writeSongNote(dir)
		return
	}

	song = s
	n := 0
	for _, v := range s.Verses {
		n += len(v)
	}
	songNote = fmt.Sprintf("교가를 읽었습니다 — %s · %d절 · %d줄\n파일: %s",
		s.SchoolName, len(s.Verses), n, found)
	writeSongNote(dir)
}

func exeDir() string {
	exe, err := os.Executable()
	if err != nil {
		return ""
	}
	if p, err := filepath.EvalSymlinks(exe); err == nil {
		exe = p
	}
	return filepath.Dir(exe)
}

// 결과를 옆에 적어 둡니다. 선생님이 "됐나 안 됐나"를 열어서 확인할 수 있게.
//
// 버전도 같이 적습니다. 나중에 "○○초 보드가 이상해요" 연락이 왔을 때
// 그 보드에 어느 판이 깔려 있는지 알 방법이 이것뿐입니다.
func writeSongNote(dir string) {
	_ = os.WriteFile(filepath.Join(dir, "교가-확인.txt"),
		[]byte("[수업도우미] 확인 파일\n\n"+
			"버전: "+version+"\n"+
			"켠 때: "+time.Now().Format("2006-01-02 15:04")+"\n\n"+
			songNote+"\n\n"+
			"(이 파일은 프로그램이 켜질 때마다 다시 씁니다. 지워도 됩니다.\n"+
			" 문제가 생기면 이 파일 내용을 그대로 알려 주세요.)\n"), 0o644)
}

func writeSampleSong(dir string) {
	p := filepath.Join(dir, "교가-예시.txt")
	if _, err := os.Stat(p); err == nil {
		return // 이미 있으면 덮어쓰지 않습니다
	}
	_ = os.WriteFile(p, []byte(sampleSongText), 0o644)
}

const sampleSongText = `# 우리 학교 교가
#
# 쓰는 법
#   1) 이 파일의 이름을 '교가-예시.txt' 에서 '교가.txt' 로 바꿉니다.
#   2) 아래 내용을 우리 학교 교가로 고칩니다.
#   3) 저장할 때 인코딩을 반드시 'UTF-8' 로 합니다.
#      (메모장 → 다른 이름으로 저장 → 아래쪽 '인코딩'을 UTF-8 로)
#   4) 수업도우미를 껐다가 다시 켭니다.
#
# 잘 됐는지는 옆에 생기는 '교가-확인.txt' 를 열어 보면 알 수 있습니다.
#
# '#' 로 시작하는 줄은 설명이라 화면에 나오지 않습니다.
#
# ※ 교가 가사와 곡에는 작사·작곡가의 저작권이 있습니다.
#    우리 학교 교가만 넣어 주세요. 다른 학교 교가를 넣으면 안 됩니다.

학교이름: ○○초등학교
후렴: 아 빛내자 우리 학교 ○○초등학교

1절
여기에 1절 첫째 줄을 적어요 [빈칸]
둘째 줄을 적어요 [보기]
줄 수는 몇 줄이든 [상관]없어요

# 2절이 없으면 아래를 통째로 지우세요.
2절
2절이 있으면 여기에 적어요 [이절]
없으면 이 세 줄을 [지움]니다

# 대괄호 [ ] 로 감싼 두 글자가 아이가 맞히는 빈칸이 됩니다.
# 대괄호를 안 쓰면 줄마다 적당한 두 글자를 알아서 고릅니다.
# '후렴' 줄은 가사 맨 아래에 늘 붙는 한 줄입니다. 없으면 지워도 됩니다.
`

/* ── 글자 인코딩 ────────────────────────────────────────── */

// 메모장이 남기는 여러 저장 방식을 받아 줍니다.
//
//	· UTF-8 (BOM 있어도 되고 없어도 됨)  ← 권장
//	· UTF-16 (메모장의 '유니코드' / '유니코드 big endian')
//
// 옛 '완성형(ANSI/CP949)' 으로 저장하면 읽을 수 없어, 다시 저장해 달라고 알립니다.
func decodeText(b []byte) (string, error) {
	switch {
	case len(b) >= 3 && b[0] == 0xEF && b[1] == 0xBB && b[2] == 0xBF:
		b = b[3:]
	case len(b) >= 2 && b[0] == 0xFF && b[1] == 0xFE:
		return decodeUTF16(b[2:], false), nil
	case len(b) >= 2 && b[0] == 0xFE && b[1] == 0xFF:
		return decodeUTF16(b[2:], true), nil
	}
	if !utf8.Valid(b) {
		return "", fmt.Errorf("글자가 UTF-8 로 저장되어 있지 않습니다")
	}
	return string(b), nil
}

func decodeUTF16(b []byte, big bool) string {
	u := make([]uint16, 0, len(b)/2)
	for i := 0; i+1 < len(b); i += 2 {
		if big {
			u = append(u, uint16(b[i])<<8|uint16(b[i+1]))
		} else {
			u = append(u, uint16(b[i+1])<<8|uint16(b[i]))
		}
	}
	return string(utf16.Decode(u))
}

/* ── 글 파일 읽기 ───────────────────────────────────────── */

var verseHeader = regexp.MustCompile(`^([0-9]+)\s*절`)

func parseSongText(text string) (*schoolSong, error) {
	s := &schoolSong{}
	var cur []string
	flush := func() {
		if len(cur) > 0 {
			s.Verses = append(s.Verses, cur)
			cur = nil
		}
	}

	for _, line := range strings.Split(strings.ReplaceAll(text, "\r\n", "\n"), "\n") {
		t := strings.TrimSpace(line)
		if t == "" || strings.HasPrefix(t, "#") {
			continue
		}
		if v, ok := cutKey(t, "학교이름"); ok {
			s.SchoolName = v
			continue
		}
		if v, ok := cutKey(t, "후렴"); ok {
			s.Refrain = v
			continue
		}
		// "1절", "2절 가사" 같은 줄은 절이 새로 시작한다는 뜻입니다.
		if m := verseHeader.FindString(t); m != "" && len([]rune(t)) <= 8 {
			flush()
			continue
		}
		cur = append(cur, t)
	}
	flush()

	if s.SchoolName == "" {
		return nil, fmt.Errorf("'학교이름: ○○초등학교' 줄이 없습니다")
	}
	if len(s.Verses) == 0 {
		return nil, fmt.Errorf("가사 줄이 하나도 없습니다")
	}
	for _, v := range s.Verses {
		for _, line := range v {
			if _, _, err := pickBlank(line); err != nil {
				return nil, fmt.Errorf("«%s» — %v", line, err)
			}
		}
	}
	if s.Refrain == "" {
		s.Refrain = "아 빛내자 우리 학교 " + s.SchoolName
	}
	return s, nil
}

// "학교이름: 값" / "학교이름 : 값" 을 받아 줍니다.
func cutKey(line, key string) (string, bool) {
	if !strings.HasPrefix(line, key) {
		return "", false
	}
	rest := strings.TrimSpace(strings.TrimPrefix(line, key))
	if !strings.HasPrefix(rest, ":") {
		return "", false
	}
	return strings.TrimSpace(strings.TrimPrefix(rest, ":")), true
}

/* ── 빈칸 고르기 (scripts/set-school-song.mjs 와 같은 규칙) ── */

var choseongTable = []string{"ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ",
	"ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"}

func choseong(r rune) string {
	c := int(r) - 44032
	if c < 0 || c > 11171 {
		return string(r)
	}
	return choseongTable[c/588]
}

var bracket = regexp.MustCompile(`\[([^\]]{2})\]`)

// 한 줄에서 빈칸으로 쓸 두 글자를 고릅니다.
// 돌려주는 값: 대괄호를 뗀 본문, 빈칸이 시작하는 자리(글자 단위)
func pickBlank(raw string) (string, int, error) {
	if m := bracket.FindStringSubmatchIndex(raw); m != nil {
		inner := raw[m[2]:m[3]]
		body := raw[:m[0]] + inner + raw[m[1]:]
		return body, len([]rune(raw[:m[0]])), nil
	}
	rs := []rune(raw)
	var cands []int
	for i := 0; i < len(rs)-1; i++ {
		if rs[i] != ' ' && rs[i+1] != ' ' {
			cands = append(cands, i)
		}
	}
	if len(cands) == 0 {
		return "", 0, fmt.Errorf("빈칸으로 쓸 두 글자를 찾지 못했습니다")
	}
	return raw, cands[len(cands)/2], nil
}

/* ── 화면이 읽는 모양으로 바꾸기 ─────────────────────────── */

type songPart struct {
	Text     string `json:"text,omitempty"`
	Target   string `json:"target,omitempty"`
	Choseong string `json:"choseong,omitempty"`
}
type songLine struct {
	FullText     string     `json:"fullText"`
	DisplayParts []songPart `json:"displayParts"`
	Answers      []string   `json:"answers"`
}
type songVerse struct {
	VerseNum    int        `json:"verseNum"`
	Title       string     `json:"title"`
	Lines       []songLine `json:"lines"`
	KeypadTiles []string   `json:"keypadTiles"`
}

var spareTiles = []string{"꿈", "빛", "별", "숲", "해", "달", "샘", "길", "들", "터"}

func (s *schoolSong) toVerses() []songVerse {
	out := make([]songVerse, 0, len(s.Verses))
	for i, raw := range s.Verses {
		var lines []songLine
		var answers []string
		for _, r := range raw {
			body, at, err := pickBlank(r)
			if err != nil {
				continue
			}
			rs := []rune(body)
			a, b := string(rs[at]), string(rs[at+1])
			var parts []songPart
			if at > 0 {
				parts = append(parts, songPart{Text: string(rs[:at])})
			}
			parts = append(parts, songPart{Target: a, Choseong: choseong(rs[at])})
			parts = append(parts, songPart{Text: " "})
			parts = append(parts, songPart{Target: b, Choseong: choseong(rs[at+1])})
			if at+2 < len(rs) {
				parts = append(parts, songPart{Text: string(rs[at+2:])})
			}
			lines = append(lines, songLine{FullText: body, DisplayParts: parts, Answers: []string{a, b}})
			answers = append(answers, a, b)
		}
		// 아이가 눌러 채우는 글자 타일: 정답 글자들 + 헷갈리게 하는 글자 두 개
		tiles := append([]string{}, answers...)
		for _, c := range spareTiles {
			if len(tiles) >= len(answers)+2 {
				break
			}
			if !contains(answers, c) {
				tiles = append(tiles, c)
			}
		}
		out = append(out, songVerse{
			VerseNum: i + 1, Title: fmt.Sprintf("교가 %d절", i+1),
			Lines: lines, KeypadTiles: tiles,
		})
	}
	return out
}

func contains(xs []string, x string) bool {
	for _, y := range xs {
		if y == x {
			return true
		}
	}
	return false
}

/* ── 내보낼 때 갈아 끼우기 ──────────────────────────────── */

// 화면 파일을 내보내기 직전에 교가 부분만 바꿉니다. exe 파일은 그대로입니다.
//
//	교가.txt 있음 → 그 학교 교가로 바꿉니다
//	교가.txt 없음 → 자리표시자로 바꾸고, 목록에서 교가 카드를 없애고,
//	                주소로 직접 들어와도 목록으로 돌려보냅니다
func applySchoolSong(name string, data []byte) []byte {
	switch {
	case strings.HasPrefix(name, "quiz/song/assets/") && strings.HasSuffix(name, ".js"),
		strings.HasPrefix(name, "song/assets/") && strings.HasSuffix(name, ".js"):
		return patchSongBundle(data)

	case name == "quiz/assets" || isQuizListBundle(name):
		if song == nil {
			return removeSongCard(data)
		}
		return data

	case songHTML(name):
		if song == nil {
			return addSongGuard(data)
		}
		return removeSongGuard(data)
	}
	return data
}

// 퀴즈 목록 번들인지 (quiz/assets/*.js 또는 assets/*.js)
func isQuizListBundle(name string) bool {
	d := path.Dir(name)
	return (d == "quiz/assets" || d == "assets") && strings.HasSuffix(name, ".js")
}

func songHTML(name string) bool {
	d := path.Dir(name)
	b := path.Base(name)
	return (d == "quiz/song" || d == "song") && (b == "index.html" || b == "app.html")
}

var placeholderSong = &schoolSong{
	SchoolName: "우리 학교",
	Refrain:    "아 빛내자 우리 학교 우리 학교",
	Verses: [][]string{{
		"여기에 우리 학교 [교가]를 적어요",
		"가사를 한 줄씩 [차례]대로 적어요",
		"대괄호로 두 글자를 [감싸]면 빈칸이 돼요",
		"대괄호를 안 쓰면 [알아]서 골라 줘요",
	}},
}

func patchSongBundle(data []byte) []byte {
	s := song
	if s == nil {
		s = placeholderSong
	}
	out := string(data)

	// 1) schoolName 과 verses 배열을 통째로 갈아 끼웁니다.
	i := strings.Index(out, "schoolName:")
	if i < 0 {
		return data
	}
	j := strings.Index(out[i:], "verses:[")
	if j < 0 {
		return data
	}
	j += i
	k := matchBracket(out, j+len("verses:"), '[', ']')
	if k < 0 {
		return data
	}
	nameJSON, _ := json.Marshal(s.SchoolName)
	versesJSON, err := json.Marshal(s.toVerses())
	if err != nil {
		return data
	}
	out = out[:i] + "schoolName:" + string(nameJSON) + ",verses:" + string(versesJSON) + out[k:]

	// 2) 후렴 한 줄은 verses 배열 밖에 따로 박혀 있어 따로 바꿉니다.
	out = refrainRe.ReplaceAllString(out,
		`<span class="refrain-text">"`+escapeAttr(s.Refrain)+`"</span>`)
	return []byte(out)
}

var refrainRe = regexp.MustCompile(`<span class="refrain-text">"[^"]*"</span>`)

// 후렴이 화면 문자열 안에 들어가므로 따옴표만 안전하게 바꿔 둡니다.
func escapeAttr(s string) string {
	return strings.NewReplacer(`"`, "”", `<`, "‹", `>`, "›", `\`, "").Replace(s)
}

// 짝이 맞는 닫는 괄호 자리를 찾습니다. 따옴표 안은 건너뜁니다.
func matchBracket(s string, from int, open, close byte) int {
	depth, inStr := 0, byte(0)
	for i := from; i < len(s); i++ {
		c := s[i]
		if inStr != 0 {
			if c == '\\' {
				i++
			} else if c == inStr {
				inStr = 0
			}
			continue
		}
		switch c {
		case '"', '\'', '`':
			inStr = c
		case open:
			depth++
		case close:
			depth--
			if depth == 0 {
				return i + 1
			}
		}
	}
	return -1
}

// 목록에서 교가 카드를 들어냅니다.
func removeSongCard(data []byte) []byte {
	s := string(data)
	i := strings.Index(s, `{id:"school"`)
	if i < 0 {
		return data
	}
	end := matchBracket(s, i, '{', '}')
	if end < 0 {
		return data
	}
	if end < len(s) && s[end] == ',' {
		end++
	} else if i > 0 && s[i-1] == ',' {
		i--
	}
	return []byte(s[:i] + s[end:])
}

const songGuardID = "song-guard"

var songGuard = `<script id="` + songGuardID + `">
  /* 교가가 아직 설정되지 않았습니다(옆에 교가.txt 가 없습니다).
     주소로 직접 들어와도 목록으로 돌려보냅니다. */
  location.replace('../');
</script>
`

func addSongGuard(data []byte) []byte {
	s := string(data)
	if strings.Contains(s, songGuardID) {
		return data
	}
	i := strings.Index(s, "</head>")
	if i < 0 {
		return data
	}
	return []byte(s[:i] + songGuard + s[i:])
}

var songGuardRe = regexp.MustCompile(`(?s)<script id="` + songGuardID + `">.*?</script>\n?`)

func removeSongGuard(data []byte) []byte {
	if !strings.Contains(string(data), songGuardID) {
		return data
	}
	return []byte(songGuardRe.ReplaceAllString(string(data), ""))
}
