//go:build !windows && !darwin

package main

import (
	"os/exec"
	"syscall"
)

// 리눅스에서는 서버 동작만 확인할 용도로 씁니다(테스트 전용).
func openBrowser(url string) *exec.Cmd { return nil }

// 백그라운드 프로세스로 떼어냅니다(부모가 끝나도 계속 돌도록).
func detach(cmd *exec.Cmd) {
	cmd.SysProcAttr = &syscall.SysProcAttr{Setsid: true}
}
