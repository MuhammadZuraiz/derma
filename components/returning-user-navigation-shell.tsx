import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import AppBottomNavigation, {
  type AppPrimaryDestination,
} from "./app-bottom-navigation";
import ScanActionsSheet from "./scan-actions-sheet";

export type ScanSheetSourceDestination =
  | "home"
  | "routine"
  | "progress"
  | "more";

export function isScanSheetSourceDestination(
  value: unknown,
): value is ScanSheetSourceDestination {
  return (
    value === "home" ||
    value === "routine" ||
    value === "progress" ||
    value === "more"
  );
}

export interface ReturningUserNavigationShellProps {
  children: ReactNode;
  activeDestination: AppPrimaryDestination;
  canOpenHome?: boolean;
  canOpenRoutine?: boolean;
  canOpenScan?: boolean;
  canOpenProgress?: boolean;
  canOpenMore?: boolean;
  canStartFacialScan?: boolean;
  canOpenIngredientScanner?: boolean;
  onOpenHome?: () => void | Promise<void>;
  onOpenRoutine?: () => void | Promise<void>;
  onOpenProgress?: () => void | Promise<void>;
  onOpenMore?: () => void | Promise<void>;
  onStartFacialScan?: (
    source: ScanSheetSourceDestination,
  ) => void | Promise<void>;
  onOpenIngredientScanner?: (
    source: ScanSheetSourceDestination,
  ) => void | Promise<void>;
}

export default function ReturningUserNavigationShell({
  children,
  activeDestination,
  canOpenHome,
  canOpenRoutine,
  canOpenScan,
  canOpenProgress,
  canOpenMore,
  canStartFacialScan,
  canOpenIngredientScanner,
  onOpenHome,
  onOpenRoutine,
  onOpenProgress,
  onOpenMore,
  onStartFacialScan,
  onOpenIngredientScanner,
}: ReturningUserNavigationShellProps) {
  const [isScanSheetOpen, setIsScanSheetOpen] =
    useState(false);
  const [scanSheetSource, setScanSheetSource] =
    useState<ScanSheetSourceDestination | null>(null);
  const mountedRef = useRef(true);
  const scanSheetOpenRef = useRef(false);
  const scanTriggerRef =
    useRef<HTMLButtonElement | null>(null);
  const previousScanSheetOpenRef = useRef(false);

  const usableActiveDestination =
    isScanSheetSourceDestination(activeDestination);
  const canOpenScanSheet =
    canOpenScan !== false && usableActiveDestination;

  const handleOpenScanSheet = useCallback(() => {
    if (scanSheetOpenRef.current) {
      return;
    }

    if (
      !isScanSheetSourceDestination(activeDestination)
    ) {
      return;
    }

    scanSheetOpenRef.current = true;
    setScanSheetSource(activeDestination);
    setIsScanSheetOpen(true);
  }, [activeDestination]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      scanSheetOpenRef.current = false;
    };
  }, []);

  const closeScanSheet = useCallback(() => {
    if (!scanSheetOpenRef.current) {
      return;
    }

    scanSheetOpenRef.current = false;

    if (!mountedRef.current) {
      return;
    }

    setIsScanSheetOpen(false);
    setScanSheetSource(null);
  }, []);

  useEffect(() => {
    const wasOpen = previousScanSheetOpenRef.current;
    previousScanSheetOpenRef.current = isScanSheetOpen;

    if (wasOpen && !isScanSheetOpen) {
      const scanTrigger = scanTriggerRef.current;

      if (scanTrigger && !scanTrigger.disabled) {
        scanTrigger.focus();
      }
    }
  }, [isScanSheetOpen]);

  const handleStartFacialScan = useCallback(async () => {
    const source = scanSheetSource;

    if (
      source === null ||
      !isScanSheetSourceDestination(source) ||
      typeof onStartFacialScan !== "function"
    ) {
      return;
    }

    await onStartFacialScan(source);
    closeScanSheet();
  }, [
    closeScanSheet,
    onStartFacialScan,
    scanSheetSource,
  ]);

  const handleOpenIngredientScanner =
    useCallback(async () => {
      const source = scanSheetSource;

      if (
        source === null ||
        !isScanSheetSourceDestination(source) ||
        typeof onOpenIngredientScanner !== "function"
      ) {
        return;
      }

      await onOpenIngredientScanner(source);
      closeScanSheet();
    }, [
      closeScanSheet,
      onOpenIngredientScanner,
      scanSheetSource,
    ]);

  return (
    <div data-testid="returning-user-navigation-shell-root">
      <div
        aria-hidden={isScanSheetOpen ? true : undefined}
        className="min-h-screen pb-[calc(8.5rem+env(safe-area-inset-bottom))]"
        data-testid="returning-user-navigation-shell-background"
        inert={isScanSheetOpen ? true : undefined}
      >
        <div data-testid="returning-user-navigation-shell-content">
          {children}
        </div>
        <AppBottomNavigation
          activeDestination={activeDestination}
          canOpenHome={canOpenHome}
          canOpenMore={canOpenMore}
          canOpenProgress={canOpenProgress}
          canOpenRoutine={canOpenRoutine}
          canOpenScan={canOpenScanSheet}
          isScanSheetOpen={isScanSheetOpen}
          onOpenHome={onOpenHome}
          onOpenMore={onOpenMore}
          onOpenProgress={onOpenProgress}
          onOpenRoutine={onOpenRoutine}
          onOpenScan={handleOpenScanSheet}
          scanTriggerRef={scanTriggerRef}
        />
      </div>
      <ScanActionsSheet
        canOpenIngredientScanner={canOpenIngredientScanner}
        canStartFacialScan={canStartFacialScan}
        isOpen={isScanSheetOpen}
        onClose={closeScanSheet}
        onOpenIngredientScanner={
          typeof onOpenIngredientScanner === "function"
            ? handleOpenIngredientScanner
            : undefined
        }
        onStartFacialScan={
          typeof onStartFacialScan === "function"
            ? handleStartFacialScan
            : undefined
        }
      />
    </div>
  );
}
