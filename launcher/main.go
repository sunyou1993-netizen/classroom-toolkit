// 수업도우미 — 단독 실행 프로그램
//
// exe 파일 하나 안에 수업 도구 9개가 통째로 들어 있습니다.
// 더블클릭하면 자기 자신에게만 웹서버를 띄우고(127.0.0.1), 그 화면을 전체화면으로 엽니다.
// 설치도, 인터넷도, 외부 서버도 필요 없습니다. 창을 닫으면 서버도 같이 꺼집니다.
package main

import (
	"embed"
	"io/fs"
	"io"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

//go:embed all:toolkit
var embedded embed.FS

// 이미 떠 있는 인스턴스를 알아보기 위한 표식입니다.
const PING = "/__suup-doumi"
const PONG = "suup-doumi"

// 윈도우 레지스트리를 타지 않도록 확장자별 타입을 직접 정합니다.
// (레지스트리가 .js 를 text/plain 으로 돌려주면 ES 모듈이 통째로 차단됩니다.)
var mimeByExt = map[string]string{
	".html": "text/html; charset=utf-8",
	".htm":  "text/html; charset=utf-8",
	".js":   "text/javascript; charset=utf-8",
	".mjs":  "text/javascript; charset=utf-8",
	".css":  "text/css; charset=utf-8",
	".json": "application/json; charset=utf-8",
	".svg":  "image/svg+xml",
	".png":  "image/png",
	".jpg":  "image/jpeg",
	".jpeg": "image/jpeg",
	".gif":  "image/gif",
	".webp": "image/webp",
	".ico":  "image/x-icon",
	".woff2": "font/woff2",
	".woff":  "font/woff",
	".ttf":   "font/ttf",
	".otf":   "font/otf",
	".mp3":   "audio/mpeg",
	".wav":   "audio/wav",
	".ogg":   "audio/ogg",
	".m4a":   "audio/mp4",
	".txt":   "text/plain; charset=utf-8",
	".map":   "application/json; charset=utf-8",
	".webmanifest": "application/manifest+json; charset=utf-8",
}

func handler(root fs.FS) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		p := path.Clean("/" + r.URL.Path)
		if p == PING {
			w.Header().Set("Content-Type", "text/plain")
			w.Write([]byte(PONG))
			return
		}
		name := strings.TrimPrefix(p, "/")

		// 폴더 주소는 index.html 로 (예: /timer/ -> timer/index.html)
		if name == "" {
			name = "index.html"
		} else if st, err := fs.Stat(root, name); err == nil && st.IsDir() {
			name = path.Join(name, "index.html")
		} else if filepath.Ext(name) == "" {
			name = path.Join(name, "index.html")
		}

		data, err := fs.ReadFile(root, name)
		if err != nil {
			http.NotFound(w, r)
			return
		}
		if ct, ok := mimeByExt[strings.ToLower(filepath.Ext(name))]; ok {
			w.Header().Set("Content-Type", ct)
		}
		// 내용은 exe 안에 고정되어 있으므로 브라우저 캐시를 쓰지 않습니다.
		w.Header().Set("Cache-Control", "no-store")
		w.Header().Set("Content-Length", strconv.Itoa(len(data)))
		if r.Method == http.MethodHead {
			return
		}
		w.Write(data)
	})
}

// 되도록 같은 포트를 써서 브라우저가 설정을 기억하게 합니다.
func listen() (net.Listener, error) {
	for port := 43110; port <= 43130; port++ {
		if l, err := net.Listen("tcp", "127.0.0.1:"+strconv.Itoa(port)); err == nil {
			return l, nil
		}
	}
	return net.Listen("tcp", "127.0.0.1:0") // 전부 막혔으면 아무 빈 포트나
}

// 이미 떠 있는 수업도우미가 있는지 확인합니다. 있으면 그 주소를 돌려줍니다.
func findRunning() string {
	c := &http.Client{Timeout: 250 * time.Millisecond}
	for port := 43110; port <= 43130; port++ {
		base := "http://127.0.0.1:" + strconv.Itoa(port)
		res, err := c.Get(base + PING)
		if err != nil {
			continue
		}
		b, _ := io.ReadAll(res.Body)
		res.Body.Close()
		if strings.TrimSpace(string(b)) == PONG {
			return base + "/"
		}
	}
	return ""
}

func main() {
	// ── 실행 방식 ────────────────────────────────────────────────
	// 더블클릭하면 이 프로그램은 곧바로 끝나고, 서버는 뒤에서 따로 돕니다.
	// 그래야 두 번째로 더블클릭했을 때 macOS 가 "응답하지 않습니다" 를 띄우지 않습니다.
	if len(os.Args) < 2 || os.Args[1] != "--serve" {
		if url := findRunning(); url != "" {
			openBrowser(url) // 이미 돌고 있으면 창만 다시 엽니다
			return
		}
		exe, err := os.Executable()
		if err != nil {
			exe = os.Args[0]
		}
		cmd := exec.Command(exe, "--serve")
		detach(cmd)
		_ = cmd.Start()
		return
	}

	// ── 여기부터가 실제 서버 ─────────────────────────────────────
	root, err := fs.Sub(embedded, "toolkit")
	if err != nil {
		os.Exit(1)
	}
	ln, err := listen()
	if err != nil {
		os.Exit(1) // 이미 다른 인스턴스가 잡고 있는 상황
	}
	go http.Serve(ln, handler(root))

	url := "http://" + ln.Addr().String() + "/"

	// 서버가 실제로 응답할 때까지 잠깐 기다립니다.
	for i := 0; i < 50; i++ {
		if c, err := net.DialTimeout("tcp", ln.Addr().String(), 200*time.Millisecond); err == nil {
			c.Close()
			break
		}
		time.Sleep(20 * time.Millisecond)
	}

	started := time.Now()
	if cmd := openBrowser(url); cmd != nil {
		cmd.Wait() // 창을 닫으면 여기서 빠져나옵니다
		// 이미 실행 중이던 브라우저에 창만 넘기고 곧바로 끝나는 경우가 있습니다.
		// 그때 서버까지 꺼지면 화면이 비므로, 그런 경우에는 계속 띄워 둡니다.
		if time.Since(started) > 3*time.Second {
			return
		}
	}
	time.Sleep(12 * time.Hour)
}
