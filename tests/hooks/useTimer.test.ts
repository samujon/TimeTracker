import { renderHook, act } from '@testing-library/react';
import { useTimer } from '../../src/components/useTimer';

describe('useTimer', () => {
  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useTimer());
    expect(result.current.isRunning).toBe(false);
    expect(result.current.startedAt).toBeNull();
    expect(typeof result.current.formattedElapsed).toBe('string');
    expect(typeof result.current.start).toBe('function');
    expect(typeof result.current.stop).toBe('function');
    expect(typeof result.current.reset).toBe('function');
  });

  it('should set isRunning and startedAt when started', () => {
    const { result } = renderHook(() => useTimer());
    expect(result.current.isRunning).toBe(false);
    act(() => {
      result.current.start();
    });
    expect(result.current.isRunning).toBe(true);
    expect(result.current.startedAt).not.toBeNull();
  });

  it('should reset to initial state on reset()', () => {
    const { result } = renderHook(() => useTimer());
    act(() => { result.current.start(); });
    act(() => { result.current.reset(); });
    expect(result.current.isRunning).toBe(false);
    expect(result.current.startedAt).toBeNull();
  });
});
