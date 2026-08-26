//go:build !windows && !darwin

package main

import (
	"os/exec"
	"syscall"
	"time"
)

// 리눅스에서는 서버 동작만 확인할 용도로 씁니다(테스트 전용).
func openBrowser(url string) *exec.Cmd { return nil }

// 백그라운드 프로세스로 떼어냅니다(부모가 끝나도 계속 돌도록).
func detach(cmd *exec.Cmd) {
	cmd.SysProcAttr = &syscall.SysProcAttr{Setsid: true}
}

// 종료 요청에 응답하지 않는 예전 버전(자기 자신의 프로세스)을 정리합니다.
// 자기 파일 이름 + --serve 로만 좁혀서 찾으므로 다른 프로그램은 건드리지 않습니다.
func killOldInstances() {
	_ = exec.Command("pkill", "-f", "suup-doumi --serve").Run()
}

func waitForClose() { time.Sleep(12 * time.Hour) }
