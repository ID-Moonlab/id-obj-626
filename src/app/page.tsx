"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    MessageCircle,
    BookOpen,
    Loader2,
    Send,
    Download,
    FileDown,
    ChevronLeft,
    ChevronRight,
    Search,
    Building2,
    Square,
    FileText,
    Edit,
} from "lucide-react";

// BaseUI Components (Radix UI based)
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputGroup } from "@/components/ui/input-group";
import { Textarea } from "@/components/ui/textarea";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    ModalTitle,
    ModalDescription,
} from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import CompanyDataSheet from "@/components/CompanyDataSheet";

const API_BASE_URL = "/api";

interface KnowledgeBase {
    id: number;
    name: string;
    description: string;
    status: string;
    doc_count: number;
    created_at: string;
}

interface Company {
    company_name: string;
    id: string;
}

interface Message {
    role: "user" | "assistant";
    content: string;
    documents?: Array<{ id: number; name: string }>;
    thinkingTime?: number;
}

// 负责展示流式输出的文本，并在流式状态下显示闪烁光标
function StreamingText({
    text,
    isStreaming,
}: {
    text: string;
    isStreaming: boolean;
}) {
    return (
        <span className="whitespace-pre-wrap break-words leading-relaxed">
            {text}
            {isStreaming && (
                <span className="ml-1 inline-block h-5 w-1.5 translate-y-[1px] bg-gray-900/70 align-middle animate-pulse" />
            )}
        </span>
    );
}

export default function Home() {
    const router = useRouter();
    const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
    const [selectedKbId, setSelectedKbId] = useState<number | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(
        null,
    );
    const tokenQueueRef = useRef<string[]>([]);
    const queueTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isQueueProcessingRef = useRef(false);

    // Download report states
    const [showCompanyList, setShowCompanyList] = useState(false);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [downloadingCompany, setDownloadingCompany] = useState<string | null>(
        null,
    );
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [confirmingCompany, setConfirmingCompany] = useState<string | null>(
        null,
    );
    const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isCompanyDataSheetOpen, setIsCompanyDataSheetOpen] = useState(false);
    const [editingCompanyInfo, setEditingCompanyInfo] = useState<any>(null);
    const [editingDailyData, setEditingDailyData] = useState<any[] | null>(null);
    const [editingScope2Data, setEditingScope2Data] = useState<any | null>(null);
    const [editingScope3Data, setEditingScope3Data] = useState<any | null>(null);
    const [editingSatelliteData, setEditingSatelliteData] = useState<any[] | null>(null);
    const [isLoadingCompanyInfo, setIsLoadingCompanyInfo] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const itemsPerPage = 10;

    useEffect(() => {
        loadKnowledgeBases();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const loadKnowledgeBases = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/dataset/read`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            });
            const result = await response.json();
            if (result.code === 200) {
                setKnowledgeBases(result.data);
                if (result.data.length > 0 && !selectedKbId) {
                    setSelectedKbId(result.data[0].id);
                }
            }
        } catch (error) {
            console.error("加载知识库失败:", error);
        }
    };

    const sendMessage = async () => {
        if (!inputMessage.trim() || !selectedKbId) {
            alert("请先选择知识库并输入消息");
            return;
        }

        const userMessage = inputMessage;
        setInputMessage("");
        setMessages((prev) => [
            ...prev,
            { role: "user", content: userMessage },
        ]);
        setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
        setIsLoading(true);

        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        try {
            const response = await fetch(`${API_BASE_URL}/rag/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    knowledge_base_id: selectedKbId,
                    query: userMessage,
                    k: 5,
                }),
                signal: abortController.signal,
            });

            if (!response.ok) {
                throw new Error(`请求失败: ${response.status}`);
            }

            if (!response.body) {
                throw new Error("响应体为空");
            }

            const reader = response.body.getReader();
            readerRef.current = reader;
            const decoder = new TextDecoder();
            let buffer = "";
            let assistantMessage = "";

            const applyChunk = (chunk: string) => {
                assistantMessage += chunk;
                setMessages((prev) => {
                    const newMessages = [...prev];
                    for (let i = newMessages.length - 1; i >= 0; i--) {
                        if (newMessages[i].role === "assistant") {
                            newMessages[i].content = assistantMessage;
                            break;
                        }
                    }
                    return newMessages;
                });
            };

            const scheduleQueueProcess = () => {
                if (queueTimerRef.current) return;
                queueTimerRef.current = setTimeout(() => {
                    queueTimerRef.current = null;
                    const chunk = tokenQueueRef.current.shift();
                    if (chunk !== undefined) {
                        applyChunk(chunk);
                    }
                    if (tokenQueueRef.current.length > 0) {
                        scheduleQueueProcess();
                    } else {
                        isQueueProcessingRef.current = false;
                    }
                }, 500); // 每条 data 间隔 0.5 秒
            };

            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split("\n\n");
                    buffer = lines.pop() || "";

                    for (const line of lines) {
                        const trimmedLine = line.trim();
                        if (!trimmedLine || !trimmedLine.startsWith("data: ")) {
                            continue;
                        }

                        try {
                            const jsonStr = trimmedLine.slice(6);
                            const data = JSON.parse(jsonStr);

                            if (data.type === "token" && data.content) {
                                tokenQueueRef.current.push(data.content);
                                if (!isQueueProcessingRef.current) {
                                    isQueueProcessingRef.current = true;
                                    scheduleQueueProcess();
                                }
                            } else if (data.type === "sources") {
                                const documents = data.documents || [];
                                setMessages((prev) => {
                                    const newMessages = [...prev];
                                    for (
                                        let i = newMessages.length - 1;
                                        i >= 0;
                                        i--
                                    ) {
                                        if (
                                            newMessages[i].role === "assistant"
                                        ) {
                                            if (documents.length > 0) {
                                                newMessages[i].documents =
                                                    documents;
                                            }
                                            break;
                                        }
                                    }
                                    return newMessages;
                                });
                            } else if (data.type === "done") {
                                const thinkingTime = data.thinking_time;
                                if (thinkingTime !== undefined) {
                                    setMessages((prev) => {
                                        const newMessages = [...prev];
                                        for (
                                            let i = newMessages.length - 1;
                                            i >= 0;
                                            i--
                                        ) {
                                            if (
                                                newMessages[i].role ===
                                                "assistant"
                                            ) {
                                                newMessages[i].thinkingTime =
                                                    thinkingTime;
                                                break;
                                            }
                                        }
                                        return newMessages;
                                    });
                                }
                            } else if (data.type === "error") {
                                throw new Error(data.error || "未知错误");
                            }
                        } catch (parseError) {
                            console.warn(
                                "解析SSE数据失败:",
                                parseError,
                                trimmedLine,
                            );
                        }
                    }
                }

                if (buffer.trim()) {
                    const trimmedLine = buffer.trim();
                    if (trimmedLine.startsWith("data: ")) {
                        try {
                            const jsonStr = trimmedLine.slice(6);
                            const data = JSON.parse(jsonStr);
                            if (data.type === "token" && data.content) {
                                tokenQueueRef.current.push(data.content);
                                if (!isQueueProcessingRef.current) {
                                    isQueueProcessingRef.current = true;
                                    scheduleQueueProcess();
                                }
                            }
                        } catch (e) {
                            console.warn("解析剩余缓冲区失败:", e);
                        }
                    }
                }
            } finally {
                if (queueTimerRef.current) {
                    clearTimeout(queueTimerRef.current);
                    queueTimerRef.current = null;
                }
                // 最后将剩余队列立即刷出，避免尾巴丢失
                while (tokenQueueRef.current.length > 0) {
                    const chunk = tokenQueueRef.current.shift();
                    if (chunk !== undefined) {
                        applyChunk(chunk);
                    }
                }
                isQueueProcessingRef.current = false;
                if (readerRef.current) {
                    readerRef.current.releaseLock();
                    readerRef.current = null;
                }
            }
        } catch (error) {
            if (error instanceof Error && error.name === "AbortError") {
                setMessages((prev) => {
                    const newMessages = [...prev];
                    for (let i = newMessages.length - 1; i >= 0; i--) {
                        if (newMessages[i].role === "assistant") {
                            if (!newMessages[i].content) {
                                newMessages[i].content = "[已停止]";
                            }
                            break;
                        }
                    }
                    return newMessages;
                });
            } else {
                console.error("发送消息失败:", error);
                setMessages((prev) => {
                    const newMessages = [...prev];
                    for (let i = newMessages.length - 1; i >= 0; i--) {
                        if (newMessages[i].role === "assistant") {
                            newMessages[i].content =
                                error instanceof Error
                                    ? `错误: ${error.message}`
                                    : "抱歉，发生了错误，请稍后重试。";
                            break;
                        }
                    }
                    return newMessages;
                });
            }
        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
            readerRef.current = null;
            tokenQueueRef.current = [];
            if (queueTimerRef.current) {
                clearTimeout(queueTimerRef.current);
                queueTimerRef.current = null;
            }
            isQueueProcessingRef.current = false;
        }
    };

    const stopMessage = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        // 流的清理在 sendMessage 的 finally 中统一处理，避免重复 cancel/releaseLock 导致运行时错误
        setIsLoading(false);
    };

    const handleGoToLoadCompanyData = () => {
        router.push("/load_company_data");
    };

    const handleDownloadTemplate = async () => {
        setIsDownloadingTemplate(true);
        setErrorMessage(null);

        try {
            const response = await fetch(`${API_BASE_URL}/download_template`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            });

            if (!response.ok) {
                throw new Error(`下载失败: ${response.status}`);
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error("无法读取响应流");
            }

            const chunks: Uint8Array[] = [];
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                if (value) {
                    chunks.push(value);
                }
            }

            const blob = new Blob(chunks as BlobPart[]);
            let filename = "[模板]碳排放数据.xlsx";
            const contentDisposition = response.headers.get(
                "Content-Disposition",
            );
            if (contentDisposition) {
                const filenameStarMatch = contentDisposition.match(
                    /filename\*=UTF-8''([^;]+)/,
                );
                if (filenameStarMatch && filenameStarMatch[1]) {
                    try {
                        filename = decodeURIComponent(filenameStarMatch[1]);
                    } catch {
                        const filenameMatch = contentDisposition.match(
                            /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/,
                        );
                        if (filenameMatch && filenameMatch[1]) {
                            filename = filenameMatch[1].replace(/['"]/g, "");
                        }
                    }
                }
            }

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : "下载模板失败，请稍后重试";
            console.error("下载模板错误:", err);
            setErrorMessage(errorMessage);
        } finally {
            setIsDownloadingTemplate(false);
        }
    };

    const handleFetchCompanyList = async () => {
        setIsLoadingCompanies(true);
        setErrorMessage(null);

        try {
            const response = await fetch(`${API_BASE_URL}/fetch_compony_list`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            });

            const data = await response.json();

            if (!response.ok || data.code !== 200) {
                throw new Error(
                    data.msg || `获取公司列表失败: ${response.status}`,
                );
            }

            if (data.data && Array.isArray(data.data)) {
                setCompanies(data.data);
                setCurrentPage(1);
                setShowCompanyList(true);
            } else {
                throw new Error("公司列表数据格式错误");
            }
        } catch (err) {
            const errorMessage =
                err instanceof Error
                    ? err.message
                    : "获取公司列表失败，请稍后重试";
            setErrorMessage(errorMessage);
            console.error("获取公司列表错误:", err);
        } finally {
            setIsLoadingCompanies(false);
        }
    };

    const handleShowConfirmDialog = (companyName: string) => {
        setConfirmingCompany(companyName);
        setShowConfirmDialog(true);
    };

    const handleConfirmGenerateReport = async () => {
        if (confirmingCompany) {
            setShowConfirmDialog(false);
            await handleDownloadCompanyReport(confirmingCompany);
            setConfirmingCompany(null);
        }
    };

    const handleCancelGenerateReport = () => {
        setShowConfirmDialog(false);
        setConfirmingCompany(null);
    };

    const handleDownloadCompanyReport = async (companyName: string) => {
        setDownloadingCompany(companyName);

        try {
            const response = await fetch(`${API_BASE_URL}/download_report`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ company: companyName }),
            });

            if (!response.ok) {
                throw new Error(`下载失败: ${response.status}`);
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error("无法读取响应流");
            }

            const chunks: Uint8Array[] = [];
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                if (value) {
                    chunks.push(value);
                }
            }

            const blob = new Blob(chunks as BlobPart[]);
            let filename = `${companyName}_报告.pdf`;
            const contentDisposition = response.headers.get(
                "Content-Disposition",
            );
            if (contentDisposition) {
                const utf8Match = contentDisposition.match(
                    /filename\*=UTF-8''([^;]+)/,
                );
                if (utf8Match && utf8Match[1]) {
                    try {
                        filename = decodeURIComponent(utf8Match[1]);
                    } catch {
                        const filenameMatch = contentDisposition.match(
                            /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/,
                        );
                        if (filenameMatch && filenameMatch[1]) {
                            filename = filenameMatch[1].replace(/['"]/g, "");
                        }
                    }
                }
            }

            if (!filename.match(/\.(pdf|docx)$/i)) {
                filename = `${companyName}_报告.pdf`;
            }

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : "下载报告失败，请稍后重试";
            console.error("下载报告错误:", err);
            setErrorMessage(errorMessage);
        } finally {
            setDownloadingCompany(null);
        }
    };

    const filteredCompanies = companies.filter((company) =>
        company.company_name.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentCompanies = filteredCompanies.slice(startIndex, endIndex);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const isNoAnswerFound = (content: string): boolean => {
        if (!content || content.trim().length === 0) {
            return false;
        }
        const noAnswerKeywords = [
            "未匹配到记录",
            "未找到答案",
            "找不到答案",
            "未找到匹配记录",
            "未找到",
            "找不到",
            "抱歉，未找到",
            "抱歉，找不到",
            "没有找到",
            "暂无答案",
            "无法找到",
        ];
        const lowerContent = content.toLowerCase();
        return noAnswerKeywords.some((keyword) =>
            lowerContent.includes(keyword.toLowerCase()),
        );
    };

    return (
        <div className="flex h-screen flex-col bg-gray-50">
            {/* Header */}
            <header className="flex items-center justify-between gap-3 border-b border-gray-200/80 bg-white/95 backdrop-blur-md px-6 py-4 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <MessageCircle className="h-5 w-5 text-gray-900" />
                        <h1 className="text-lg font-semibold text-gray-900">
                            智能对话助手
                        </h1>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    onClick={() => router.push("/f/knowledge_man")}
                    className="min-w-0 w-10 h-10 p-0 rounded-xl transition-all duration-200 hover:bg-gray-100"
                    aria-label="知识库管理"
                >
                    <BookOpen className="h-5 w-5 text-gray-900" />
                </Button>
            </header>

            {/* Error Banner */}
            {errorMessage && (
                <div className="border-b border-red-200/60 bg-gradient-to-r from-red-50 to-red-100/50 px-6 py-3 shadow-sm">
                    <div className="max-w-7xl mx-auto">
                        <p className="text-sm text-red-800 font-medium flex items-center gap-2">
                            <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-red-600"></span>
                            {errorMessage}
                        </p>
                    </div>
                </div>
            )}

            {/* Confirm Report Dialog */}
            <Modal open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <ModalContent className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-lg w-full mx-4 rounded-2xl shadow-2xl">
                    <ModalHeader>
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 p-3 rounded-xl bg-gray-100 border border-gray-200 shadow-sm">
                                <FileText
                                    className="h-6 w-6 text-gray-900"
                                    strokeWidth={2}
                                />
                            </div>
                            <div className="flex-1 space-y-1">
                                <ModalTitle>确认生成报告</ModalTitle>
                                <ModalDescription>
                                    即将为以下公司生成碳排放认证报告
                                </ModalDescription>
                            </div>
                        </div>
                    </ModalHeader>
                    <ModalBody>
                        <div className="mt-4 p-4 rounded-xl bg-gray-50 border border-gray-200 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="flex-shrink-0 p-2 rounded-xl bg-white border border-gray-200 shadow-sm">
                                    <Building2 className="h-4 w-4 text-gray-900" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-gray-600 mb-1">
                                        公司名称
                                    </p>
                                    <p className="text-base font-semibold text-gray-900 truncate">
                                        {confirmingCompany}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-3 p-3 rounded-xl bg-gray-100 border border-gray-200 shadow-sm">
                            <p className="text-xs text-gray-600 leading-relaxed">
                                <span className="font-medium">提示：</span>
                                报告生成可能需要几秒钟时间，请耐心等待。
                            </p>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            variant="outline"
                            onClick={handleCancelGenerateReport}
                            disabled={downloadingCompany === confirmingCompany}
                            className="rounded-xl"
                        >
                            取消
                        </Button>
                        <Button
                            onClick={handleConfirmGenerateReport}
                            loading={downloadingCompany === confirmingCompany}
                            className="rounded-xl bg-gray-900 text-white hover:bg-gray-800"
                        >
                            {downloadingCompany === confirmingCompany
                                ? "生成中..."
                                : "确认生成"}
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            {/* Company List Modal */}
            <Modal
                open={showCompanyList}
                onOpenChange={(open) => {
                    setShowCompanyList(open);
                    if (!open) {
                        setCompanies([]);
                        setCurrentPage(1);
                        setSearchQuery("");
                    }
                }}
                size="3xl"
            >
                <ModalContent className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-h-[80vh] w-full max-w-3xl mx-4 overflow-hidden flex flex-col rounded-2xl shadow-2xl">
                    <ModalHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-gray-100 shadow-sm">
                                <Building2 className="h-5 w-5 text-gray-900" />
                            </div>
                            <div className="flex-1">
                                <ModalTitle>选择公司生成报告</ModalTitle>
                                <ModalDescription>
                                    从列表中选择一个公司，为其生成碳排放报告
                                </ModalDescription>
                            </div>
                        </div>
                    </ModalHeader>
                    <ModalBody className="flex-1 overflow-y-auto">
                        {companies.length > 0 && (
                            <div className="pb-4">
                                <InputGroup
                                    placeholder="搜索公司名称..."
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    startContent={
                                        <Search className="h-4 w-4 text-gray-400" />
                                    }
                                    className="rounded-xl"
                                />
                            </div>
                        )}

                        {companies.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="p-4 rounded-full bg-gray-100 mb-4">
                                    <Building2 className="h-8 w-8 text-gray-900" />
                                </div>
                                <p className="text-lg font-medium text-gray-900 mb-2">
                                    暂无公司数据
                                </p>
                                <p className="text-sm text-gray-600">
                                    请先录入企业数据
                                </p>
                            </div>
                        ) : filteredCompanies.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="p-4 rounded-full bg-gray-100 mb-4">
                                    <Search className="h-8 w-8 text-gray-900" />
                                </div>
                                <p className="text-lg font-medium text-gray-900 mb-2">
                                    未找到匹配的公司
                                </p>
                                <p className="text-sm text-gray-600">
                                    请尝试其他搜索关键词
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-2">
                                    {currentCompanies.map((company) => (
                                        <Card
                                            key={company.id}
                                            className="hover:bg-gray-50 transition-all duration-200 rounded-xl cursor-pointer"
                                        >
                                            <CardContent className="p-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                        <div className="p-2 rounded-xl bg-gray-100 shadow-sm">
                                                            <Building2 className="h-4 w-4 text-gray-900" />
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-900 truncate">
                                                            {
                                                                company.company_name
                                                            }
                                                        </span>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        onClick={() =>
                                                            handleShowConfirmDialog(
                                                                company.company_name,
                                                            )
                                                        }
                                                        disabled={
                                                            downloadingCompany ===
                                                                company.company_name ||
                                                            showConfirmDialog
                                                        }
                                                        loading={
                                                            downloadingCompany ===
                                                            company.company_name
                                                        }
                                                        className="rounded-xl bg-gray-900 text-white hover:bg-gray-800"
                                                    >
                                                        {downloadingCompany ===
                                                        company.company_name
                                                            ? "生成中..."
                                                            : "生成报告"}
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>

                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                setCurrentPage((prev) =>
                                                    Math.max(1, prev - 1),
                                                )
                                            }
                                            disabled={currentPage === 1}
                                            startContent={
                                                <ChevronLeft className="h-4 w-4" />
                                            }
                                            className="rounded-xl"
                                        >
                                            上一页
                                        </Button>
                                        <div className="flex items-center gap-2 text-sm">
                                            <span className="font-medium text-gray-900">
                                                第 {currentPage} / {totalPages}{" "}
                                                页
                                            </span>
                                            <span className="text-gray-600">
                                                （共 {filteredCompanies.length}{" "}
                                                条）
                                            </span>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                                setCurrentPage((prev) =>
                                                    Math.min(
                                                        totalPages,
                                                        prev + 1,
                                                    ),
                                                )
                                            }
                                            disabled={
                                                currentPage === totalPages
                                            }
                                            endContent={
                                                <ChevronRight className="h-4 w-4" />
                                            }
                                            className="rounded-xl"
                                        >
                                            下一页
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </ModalBody>
                </ModalContent>
            </Modal>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <div className="w-80 border-r border-gray-200/80 bg-white shadow-sm flex flex-col">
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Quick Actions */}
                        <div className="px-4 pt-6 pb-4 space-y-3">
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-3">
                                快速操作
                            </div>

                            {/* Download Template Button */}
                            <Button
                                onClick={handleDownloadTemplate}
                                loading={isDownloadingTemplate}
                                className="w-full gap-3 bg-gray-900 text-white hover:bg-gray-800 rounded-xl font-medium h-12 justify-start"
                            >
                                <FileDown className="h-4 w-4" />
                                <span className="flex-1 text-left">
                                    {isDownloadingTemplate
                                        ? "下载中..."
                                        : "下载模板"}
                                </span>
                            </Button>

                            {/* Generate Report Button */}
                            <Button
                                onClick={handleFetchCompanyList}
                                loading={isLoadingCompanies}
                                className="w-full gap-3 bg-gray-900 text-white hover:bg-gray-800 rounded-xl font-medium h-12 justify-start"
                            >
                                <FileText className="h-4 w-4" />
                                <span className="flex-1 text-left">
                                    {isLoadingCompanies
                                        ? "加载中..."
                                        : "生成报告"}
                                </span>
                            </Button>
                        </div>

                        <Separator />

                        {/* Knowledge Base Selection */}
                        <div className="flex-1 px-4 pt-6 pb-4 overflow-y-auto min-h-0">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-semibold text-gray-700">
                                        选择知识库
                                    </label>
                                    <Badge variant="secondary">
                                        {knowledgeBases.length} 个
                                    </Badge>
                                </div>
                                <Select
                                    value={selectedKbId?.toString() || ""}
                                    onValueChange={(value) =>
                                        setSelectedKbId(Number(value))
                                    }
                                >
                                    <SelectTrigger className="rounded-xl">
                                        <SelectValue placeholder="请选择知识库" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {knowledgeBases.map((kb) => (
                                            <SelectItem
                                                key={kb.id.toString()}
                                                value={kb.id.toString()}
                                            >
                                                {kb.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col bg-white">
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {messages.length === 0 && (
                            <div className="flex items-center justify-center h-full">
                                <Card className="text-center p-8 rounded-2xl shadow-lg border-0 bg-gradient-to-br from-gray-50 to-white max-w-md">
                                    <CardContent className="pt-6">
                                        <div className="p-4 rounded-full bg-gray-900 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                            <MessageCircle className="h-8 w-8 text-white" />
                                        </div>
                                        <p className="text-gray-600 font-medium">
                                            开始对话吧！选择一个知识库后输入您的问题。
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex flex-col ${
                                    msg.role === "user"
                                        ? "items-end"
                                        : "items-start"
                                }`}
                            >
                                <Card
                                    className={`max-w-3xl rounded-2xl shadow-md ${
                                        msg.role === "user"
                                            ? "bg-gray-900 text-white border-0"
                                            : "bg-white border border-gray-200"
                                    }`}
                                >
                                    <CardContent className="p-5">
                                        {msg.role === "assistant" &&
                                        !msg.content &&
                                        isLoading ? (
                                            <div className="flex items-center gap-2">
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                <span className="text-gray-500">
                                                    正在思考...
                                                </span>
                                            </div>
                                        ) : (
                                            <div>
                                                <StreamingText
                                                    text={msg.content}
                                                    isStreaming={
                                                        msg.role === "assistant" &&
                                                        isLoading &&
                                                        idx === messages.length - 1
                                                    }
                                                />
                                                {msg.role === "assistant" &&
                                                    msg.content &&
                                                    msg.thinkingTime !==
                                                        undefined && (
                                                        <div className="mt-3 pt-3 border-t border-gray-200">
                                                            <p className="text-xs text-gray-500">
                                                                思考耗时:{" "}
                                                                <span className="font-medium text-gray-700">
                                                                    {
                                                                        msg.thinkingTime
                                                                    }
                                                                </span>{" "}
                                                                秒
                                                            </p>
                                                        </div>
                                                    )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Document Download Button and Edit Company Button */}
                                {msg.role === "assistant" &&
                                    msg.documents &&
                                    msg.documents.length === 1 &&
                                    msg.documents[0]?.id &&
                                    !isNoAnswerFound(msg.content || "") && (
                                        <div className="mt-3 flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="rounded-xl border-gray-300 hover:border-gray-900 hover:bg-gray-50"
                                                onClick={async () => {
                                                    try {
                                                        const doc =
                                                            msg.documents![0];
                                                        if (!doc || !doc.id) {
                                                            throw new Error(
                                                                "文档信息无效",
                                                            );
                                                        }

                                                        const response =
                                                            await fetch(
                                                                `${API_BASE_URL}/document/download`,
                                                                {
                                                                    method: "POST",
                                                                    headers: {
                                                                        "Content-Type":
                                                                            "application/json",
                                                                    },
                                                                    body: JSON.stringify(
                                                                        {
                                                                            id: doc.id,
                                                                        },
                                                                    ),
                                                                },
                                                            );

                                                        if (!response.ok) {
                                                            const errorText =
                                                                await response.text();
                                                            throw new Error(
                                                                `下载失败: ${response.status} - ${errorText}`,
                                                            );
                                                        }

                                                        const blob =
                                                            await response.blob();
                                                        if (
                                                            !blob ||
                                                            blob.size === 0
                                                        ) {
                                                            throw new Error(
                                                                "下载的文件为空",
                                                            );
                                                        }

                                                        const url =
                                                            window.URL.createObjectURL(
                                                                blob,
                                                            );
                                                        const a =
                                                            document.createElement(
                                                                "a",
                                                            );
                                                        a.href = url;
                                                        const filename =
                                                            doc.name ||
                                                            `文档_${doc.id}.pdf`;
                                                        a.download = filename;
                                                        document.body.appendChild(
                                                            a,
                                                        );
                                                        a.click();
                                                        setTimeout(() => {
                                                            window.URL.revokeObjectURL(
                                                                url,
                                                            );
                                                            document.body.removeChild(
                                                                a,
                                                            );
                                                        }, 100);
                                                    } catch (error) {
                                                        console.error(
                                                            "下载文档失败:",
                                                            error,
                                                        );
                                                        const errorMessage =
                                                            error instanceof
                                                            Error
                                                                ? error.message
                                                                : "下载文档失败，请稍后重试";
                                                        alert(errorMessage);
                                                    }
                                                }}
                                            >
                                                <Download className="h-3 w-3 mr-2" />
                                                {msg.documents[0].name ||
                                                    `文档_${msg.documents[0].id}`}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="rounded-xl border-gray-300 hover:border-gray-900 hover:bg-gray-50"
                                                onClick={async () => {
                                                    try {
                                                        // 从文档名称中提取公司名称
                                                        const docName = msg.documents![0].name || "";
                                                        // 去掉文件扩展名
                                                        const companyName = docName.replace(/\.[^/.]+$/, "");
                                                        
                                                        if (!companyName) {
                                                            alert("无法从文档名称中提取公司名称");
                                                            return;
                                                        }

                                                        setIsLoadingCompanyInfo(true);
                                                        const response = await fetch(
                                                            `${API_BASE_URL}/company_by_name`,
                                                            {
                                                                method: "POST",
                                                                headers: {
                                                                    "Content-Type": "application/json",
                                                                },
                                                                body: JSON.stringify({
                                                                    company_name: companyName,
                                                                }),
                                                            }
                                                        );

                                                        if (!response.ok) {
                                                            const errorText = await response.text();
                                                            throw new Error(
                                                                `获取企业信息失败: ${response.status} - ${errorText}`
                                                            );
                                                        }

                                                        const result = await response.json();
                                                        if (result.success && result.data?.company) {
                                                            setEditingCompanyInfo(result.data.company);
                                                            // 设置所有相关数据
                                                            setEditingDailyData(result.data.dailyData || []);
                                                            setEditingScope2Data(result.data.scope2 || null);
                                                            setEditingScope3Data(result.data.scope3 || null);
                                                            setEditingSatelliteData(result.data.satelliteData || []);
                                                            setIsCompanyDataSheetOpen(true);
                                                        } else {
                                                            throw new Error(
                                                                result.message || "获取企业信息失败"
                                                            );
                                                        }
                                                    } catch (error) {
                                                        console.error("获取企业信息失败:", error);
                                                        const errorMessage =
                                                            error instanceof Error
                                                                ? error.message
                                                                : "获取企业信息失败，请稍后重试";
                                                        alert(errorMessage);
                                                    } finally {
                                                        setIsLoadingCompanyInfo(false);
                                                    }
                                                }}
                                                disabled={isLoadingCompanyInfo}
                                            >
                                                {isLoadingCompanyInfo ? (
                                                    <>
                                                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                                        加载中...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Edit className="h-3 w-3 mr-2" />
                                                        修改企业信息
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    )}

                                {/* No Answer Found - Add Company */}
                                {msg.role === "assistant" &&
                                    msg.content &&
                                    !isLoading &&
                                    isNoAnswerFound(msg.content) && (
                                        <div className="mt-3">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    setIsCompanyDataSheetOpen(
                                                        true,
                                                    )
                                                }
                                                className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl"
                                            >
                                                添加企业
                                            </Button>
                                        </div>
                                    )}
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="border-t border-gray-200/80 bg-white p-6 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.05)]">
                        <div className="flex gap-3 max-w-6xl mx-auto items-end">
                            <div className="flex-1">
                                <Input
                                    value={inputMessage}
                                    onChange={(e) =>
                                        setInputMessage(e.target.value)
                                    }
                                    onKeyDown={(e) =>
                                        e.key === "Enter" &&
                                        !e.shiftKey &&
                                        !isLoading &&
                                        sendMessage()
                                    }
                                    placeholder={
                                        selectedKbId
                                            ? "输入您的问题..."
                                            : "请先选择知识库..."
                                    }
                                    disabled={isLoading || !selectedKbId}
                                    className="w-full rounded-2xl h-[72px] bg-white border-gray-200 text-lg"
                                />
                            </div>
                            {isLoading ? (
                                <Button
                                    onClick={stopMessage}
                                    className="h-[72px] w-[72px] rounded-2xl bg-gray-900 text-white hover:bg-gray-800"
                                >
                                    <Square className="h-6 w-6" />
                                </Button>
                            ) : (
                                <Button
                                    onClick={sendMessage}
                                    disabled={
                                        !selectedKbId || !inputMessage.trim()
                                    }
                                    className="h-[72px] w-[72px] rounded-2xl bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50"
                                >
                                    <Send className="h-6 w-6" />
                                </Button>
                            )}
                        </div>
                        {(isLoading || !selectedKbId) && (
                            <div className="mt-3 text-center">
                                {!selectedKbId && (
                                    <p className="text-xs text-gray-400">
                                        请先在左侧选择知识库
                                    </p>
                                )}
                                {isLoading && (
                                    <p className="text-xs text-gray-600 flex items-center justify-center gap-1.5">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        正在处理您的请求...
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Company Data Sheet */}
            <CompanyDataSheet
                open={isCompanyDataSheetOpen}
                onOpenChange={(open) => {
                    setIsCompanyDataSheetOpen(open);
                    if (!open) {
                        // 关闭时重置编辑数据
                        setEditingCompanyInfo(null);
                        setEditingDailyData(null);
                        setEditingScope2Data(null);
                        setEditingScope3Data(null);
                        setEditingSatelliteData(null);
                    }
                }}
                initialCompanyInfo={editingCompanyInfo}
                initialDailyData={editingDailyData}
                initialScope2Data={editingScope2Data}
                initialScope3Data={editingScope3Data}
                initialSatelliteData={editingSatelliteData}
            />
        </div>
    );
}
