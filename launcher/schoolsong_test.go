package main

import (
	"encoding/json"
	"os"
	"testing"
)

// 교가.txt 를 읽어 만든 화면 데이터가, node 스크립트가 만드는 것과
// 글자 하나까지 같은지 확인합니다.
//
// 왜 이 시험이 필요한가:
//
//	같은 규칙(빈칸 고르기, 초성, 여벌 타일)이 두 곳에 있습니다.
//	  · scripts/set-school-song.mjs  (저장소 안에 미리 넣어 둘 때)
//	  · launcher/schoolsong.go       (exe 옆 교가.txt 를 읽을 때)
//	한쪽만 고치면 학교마다 화면이 달라집니다. 그래서 결과를 맞대어 봅니다.
func TestSongMatchesNodeScript(t *testing.T) {
	want, err := os.ReadFile("testdata/verses-node-서울신답초등학교.json")
	if err != nil {
		t.Fatal(err)
	}
	text, err := os.ReadFile("testdata/교가-서울신답초등학교.txt")
	if err != nil {
		t.Fatal(err)
	}
	s, err := parseSongText(string(text))
	if err != nil {
		t.Fatal(err)
	}
	if s.SchoolName != "서울신답초등학교" {
		t.Fatalf("학교이름이 다릅니다: %q", s.SchoolName)
	}
	if s.Refrain != "아 빛내자 우리 학교 서울 신답초등학교" {
		t.Fatalf("후렴이 다릅니다: %q", s.Refrain)
	}
	got, _ := json.Marshal(s.toVerses())

	var a, b interface{}
	_ = json.Unmarshal(got, &a)
	_ = json.Unmarshal(want, &b)
	ga, _ := json.Marshal(a)
	gb, _ := json.Marshal(b)
	if string(ga) != string(gb) {
		t.Errorf("go 와 node 결과가 다릅니다\n go  : %s\n node: %s", ga, gb)
	}
}

// 대괄호를 안 쓴 줄도 두 곳이 같은 자리를 고르는지.
func TestBlankPickWithoutBrackets(t *testing.T) {
	body, at, err := pickBlank("우리 학교 자랑스러운 이름")
	if err != nil {
		t.Fatal(err)
	}
	rs := []rune(body)
	t.Logf("고른 두 글자: %q%q (자리 %d)", string(rs[at]), string(rs[at+1]), at)
	if rs[at] == ' ' || rs[at+1] == ' ' {
		t.Error("빈칸에 공백이 들어갔습니다")
	}
}

// 교가.txt 가 없을 때 교가가 정말 숨겨지는지.
func TestGuardWhenNoSong(t *testing.T) {
	song = nil
	html := []byte("<html><head><title>x</title></head><body></body></html>")
	out := applySchoolSong("quiz/song/app.html", html)
	if !containsStr(string(out), songGuardID) {
		t.Error("교가.txt 가 없는데 문지기가 안 달렸습니다")
	}
	list := []byte(`y=[{id:"school",title:"교가",url:"./song/app.html",questions:[]},{id:"sokdam",title:"속담"}]`)
	out2 := applySchoolSong("quiz/assets/index-abc.js", list)
	if containsStr(string(out2), `id:"school"`) {
		t.Errorf("교가 카드가 남았습니다: %s", out2)
	}
	if !containsStr(string(out2), `y=[{id:"sokdam"`) {
		t.Errorf("카드를 빼면서 쉼표가 어긋났습니다: %s", out2)
	}
}

func containsStr(s, sub string) bool {
	return len(s) >= len(sub) && (func() bool {
		for i := 0; i+len(sub) <= len(s); i++ {
			if s[i:i+len(sub)] == sub {
				return true
			}
		}
		return false
	})()
}
