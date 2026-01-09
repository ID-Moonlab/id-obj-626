"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Button,
    Input,
    Textarea,
    Card,
    CardBody,
    CardHeader,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Chip,
    Divider,
} from "@heroui/react";
import {
    BookOpen,
    Upload,
    Trash2,
    FileText,
    Plus,
    Loader2,
} from "lucide-react";
import { Pagination } from "@/components/ui/pagination";

const API_BASE_URL = "/api";

interface KnowledgeBase {
    id: number;
    name: string;
    description: string;
    status: string;
    doc_count: number;
    created_at: string;
}

interface Document {
    id: number;
    name: string;
    file_type: string;
    file_size: number;
    status: string;
    chunk_count: number;
    created_at: string;
}

export default function KnowledgeManagementPage() {
    const router = useRouter();
    const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
    const [selectedKbId, setSelectedKbId] = useState<number | null>(null);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [newKbName, setNewKbName] = useState("");
    const [newKbDescription, setNewKbDescription] = useState("");
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [parsingDocId, setParsingDocId] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10); // 每页显示10条

    useEffect(() => {
        loadKnowledgeBases();
    }, []);

    useEffect(() => {
        if (selectedKbId) {
            loadDocuments(selectedKbId);
            setCurrentPage(1); // 切换知识库时重置到第一页
        }
    }, [selectedKbId]);

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

    const loadDocuments = async (kbId: number) => {
        try {
            const response = await fetch(`${API_BASE_URL}/document/read`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ knowledge_base_id: kbId }),
            });
            const result = await response.json();
            if (result.code === 200) {
                setDocuments(result.data);
            }
        } catch (error) {
            console.error("加载文档失败:", error);
        }
    };

    const createKnowledgeBase = async () => {
        if (!newKbName.trim()) {
            alert("请输入知识库名称");
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/dataset/create`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newKbName,
                    description: newKbDescription,
                    user_id: 1,
                }),
            });
            const result = await response.json();
            if (result.code === 200) {
                setNewKbName("");
                setNewKbDescription("");
                setIsCreateDialogOpen(false);
                loadKnowledgeBases();
            } else {
                alert(result.msg);
            }
        } catch (error) {
            console.error("创建知识库失败:", error);
            alert("创建失败");
        }
    };

    const deleteKnowledgeBase = async (id: number) => {
        if (!confirm("确定要删除这个知识库吗？这将删除所有相关文档。")) {
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/dataset/delete`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
            const result = await response.json();
            if (result.code === 200) {
                loadKnowledgeBases();
                if (selectedKbId === id) {
                    setSelectedKbId(null);
                }
            } else {
                alert(result.msg);
            }
        } catch (error) {
            console.error("删除知识库失败:", error);
            alert("删除失败");
        }
    };

    const uploadDocument = async (file: File, kbId: number) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("knowledge_base_id", kbId.toString());

        try {
            const response = await fetch(`${API_BASE_URL}/document/upload`, {
                method: "POST",
                body: formData,
            });
            const result = await response.json();
            if (result.code === 200) {
                loadDocuments(kbId);
            } else {
                alert(result.msg);
            }
        } catch (error) {
            console.error("上传文档失败:", error);
            alert("上传失败");
        }
    };

    const startParseDocument = async (docId: number) => {
        setParsingDocId(docId);
        try {
            const response = await fetch(
                `${API_BASE_URL}/document/parse/start`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: docId }),
                },
            );
            const result = await response.json();
            if (result.code === 200) {
                loadDocuments(selectedKbId!);
                checkDocumentStatus(docId);
            } else {
                setParsingDocId(null);
            }
        } catch (error) {
            console.error("开始解析失败:", error);
            setParsingDocId(null);
        }
    };

    const reparseDocument = async (docId: number) => {
        if (
            !confirm(
                "确定要重新解析这个文档吗？这将删除旧的解析数据并重新解析。",
            )
        ) {
            return;
        }

        setParsingDocId(docId);
        try {
            const response = await fetch(
                `${API_BASE_URL}/document/parse/reparse`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: docId }),
                },
            );
            const result = await response.json();
            if (result.code === 200) {
                loadDocuments(selectedKbId!);
                checkDocumentStatus(docId);
            } else {
                setParsingDocId(null);
                alert(result.msg || "重新解析失败");
            }
        } catch (error) {
            console.error("重新解析失败:", error);
            setParsingDocId(null);
            alert("重新解析失败，请稍后重试");
        }
    };

    const checkDocumentStatus = async (docId: number) => {
        const interval = setInterval(async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/document/read`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ knowledge_base_id: selectedKbId }),
                });
                const result = await response.json();
                if (result.code === 200) {
                    const doc = result.data.find(
                        (d: Document) => d.id === docId,
                    );
                    if (
                        doc &&
                        (doc.status === "completed" || doc.status === "failed")
                    ) {
                        clearInterval(interval);
                        setParsingDocId(null);
                        loadDocuments(selectedKbId!);
                    }
                }
            } catch (error) {
                clearInterval(interval);
                setParsingDocId(null);
            }
        }, 2000);
    };

    const deleteDocument = async (id: number) => {
        if (!confirm("确定要删除这个文档吗？")) {
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/document/delete`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });
            const result = await response.json();
            if (result.code === 200) {
                loadDocuments(selectedKbId!);
            } else {
                alert(result.msg);
            }
        } catch (error) {
            console.error("删除文档失败:", error);
            alert("删除失败");
        }
    };

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<
            string,
            { label: string; className: string }
        > = {
            completed: {
                label: "已完成",
                className:
                    "bg-green-100 text-green-700 border border-green-200",
            },
            processing: {
                label: "处理中",
                className: "bg-blue-100 text-blue-700 border border-blue-200",
            },
            failed: {
                label: "失败",
                className: "bg-red-100 text-red-700 border border-red-200",
            },
            pending: {
                label: "待处理",
                className: "bg-gray-100 text-gray-700 border border-gray-200",
            },
        };
        const config = statusConfig[status] || {
            label: status,
            className: "bg-gray-100 text-gray-700 border border-gray-200",
        };
        return (
            <Chip className={config.className} size="sm" variant="flat">
                {config.label}
            </Chip>
        );
    };

    // 计算分页后的文档列表
    const getPaginatedDocuments = () => {
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        return documents.slice(startIndex, endIndex);
    };

    // 计算总页数
    const totalPages = Math.ceil(documents.length / pageSize);

    return (
        <div className="flex h-screen flex-col bg-slate-50">
            {/* Header */}
            <header className="flex items-center justify-between gap-3 border-b border-slate-200/80 bg-white/95 backdrop-blur-md px-6 py-4 shadow-sm">
                <div className="flex items-center gap-3">
                    <Button
                        variant="light"
                        onPress={() => router.push("/")}
                        className="gap-2 rounded-xl hover:bg-slate-100 transition-all duration-200"
                    >
                        ← 返回
                    </Button>
                    <h1 className="text-xl font-bold flex items-center gap-2 text-blue-700">
                        <div className="p-2 rounded-xl bg-blue-600/10 shadow-sm">
                            <BookOpen className="h-5 w-5 text-blue-700" />
                        </div>
                        知识库管理
                    </h1>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* 侧边栏 - 知识库列表 */}
                <div className="w-80 border-r border-slate-200/80 bg-white shadow-sm">
                    <div className="flex h-full flex-col">
                        <div className="border-b border-slate-200/60 p-6 bg-gradient-to-br from-blue-50 to-blue-100/50">
                            <h2 className="text-lg font-semibold text-blue-700">
                                知识库列表
                            </h2>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            <Modal
                                isOpen={isCreateDialogOpen}
                                onClose={() => {
                                    setIsCreateDialogOpen(false);
                                    setNewKbName("");
                                    setNewKbDescription("");
                                }}
                                size="lg"
                            >
                                <ModalContent className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-2xl w-full mx-4 rounded-3xl shadow-2xl overflow-hidden border border-gray-200 bg-gradient-to-br from-white via-gray-50 to-gray-100">
                                    {(onClose) => (
                                        <>
                                            {/* Header with black/white gradient */}
                                            <ModalHeader className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black py-8 px-8">
                                                {/* Decorative background elements */}
                                                <div className="absolute inset-0 overflow-hidden">
                                                    <div className="absolute -top-24 -right-24 w-72 h-72 bg-white/5 rounded-full blur-3xl"></div>
                                                    <div className="absolute -bottom-36 -left-24 w-96 h-96 bg-gray-600/10 rounded-full blur-3xl"></div>
                                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-br from-transparent via-gray-700/5 to-transparent rounded-full blur-2xl"></div>
                                                </div>

                                                <div className="relative flex items-center gap-5">
                                                    <div className="relative">
                                                        <div className="absolute inset-0 bg-white/10 rounded-2xl blur-xl"></div>
                                                        <div className="relative p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl">
                                                            <BookOpen className="h-7 w-7 text-white" />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1">
                                                        <h2 className="text-2xl font-bold text-white tracking-tight">
                                                            创建知识库
                                                        </h2>
                                                        <p className="text-gray-300 mt-1 text-sm font-medium">
                                                            创建一个新的知识库来管理您的文档
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Close button */}
                                                <button
                                                    onClick={onClose}
                                                    className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-200 border border-white/20 hover:border-white/30"
                                                >
                                                    <svg
                                                        className="w-5 h-5 text-gray-300"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M6 18L18 6M6 6l12 12"
                                                        />
                                                    </svg>
                                                </button>
                                            </ModalHeader>

                                            {/* Body */}
                                            <ModalBody className="px-8 py-8 bg-white">
                                                <div className="space-y-7">
                                                    {/* Knowledge Base Name */}
                                                    <div className="group">
                                                        <label
                                                            htmlFor="name"
                                                            className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2.5"
                                                        >
                                                            <div className="p-1 rounded-lg bg-gray-100 group-focus-within:bg-gray-200 transition-colors">
                                                                <svg
                                                                    className="w-4 h-4 text-gray-600"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={
                                                                            2
                                                                        }
                                                                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                                                                    />
                                                                </svg>
                                                            </div>
                                                            知识库名称
                                                            <span className="text-gray-400 ml-1">
                                                                *
                                                            </span>
                                                        </label>
                                                        <div className="relative">
                                                            <Input
                                                                id="name"
                                                                placeholder="给您的知识库起个名字..."
                                                                value={
                                                                    newKbName
                                                                }
                                                                onValueChange={
                                                                    setNewKbName
                                                                }
                                                                onKeyDown={(
                                                                    e,
                                                                ) => {
                                                                    if (
                                                                        e.key ===
                                                                            "Enter" &&
                                                                        newKbName.trim()
                                                                    ) {
                                                                        createKnowledgeBase();
                                                                    }
                                                                }}
                                                                className="rounded-xl bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400"
                                                            />
                                                        </div>
                                                        <p className="mt-2 text-xs text-gray-500 flex items-center gap-1.5">
                                                            <svg
                                                                className="w-3.5 h-3.5 text-gray-400"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={
                                                                        2
                                                                    }
                                                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                                />
                                                            </svg>
                                                            知识库名称用于标识和管理您的文档集合
                                                        </p>
                                                    </div>

                                                    {/* Description */}
                                                    <div className="group">
                                                        <label
                                                            htmlFor="description"
                                                            className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2.5"
                                                        >
                                                            <div className="p-1 rounded-lg bg-gray-100 group-focus-within:bg-gray-200 transition-colors">
                                                                <svg
                                                                    className="w-4 h-4 text-gray-600"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={
                                                                            2
                                                                        }
                                                                        d="M4 6h16M4 12h16M4 18h7"
                                                                    />
                                                                </svg>
                                                            </div>
                                                            描述
                                                            <span className="text-gray-400 text-xs font-normal ml-1">
                                                                （可选）
                                                            </span>
                                                        </label>
                                                        <Textarea
                                                            id="description"
                                                            placeholder="添加描述可以帮助您更好地组织和识别知识库..."
                                                            value={
                                                                newKbDescription
                                                            }
                                                            onValueChange={
                                                                setNewKbDescription
                                                            }
                                                            minRows={3}
                                                            maxRows={5}
                                                            className="rounded-xl bg-gray-50 border-gray-200 text-gray-800 placeholder:text-gray-400 text-base resize-none"
                                                        />
                                                        <p className="mt-2 text-xs text-gray-500 flex items-center gap-1.5">
                                                            <svg
                                                                className="w-3.5 h-3.5 text-gray-400"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={
                                                                        2
                                                                    }
                                                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                                />
                                                            </svg>
                                                            描述信息可以帮助您快速识别知识库的用途
                                                        </p>
                                                    </div>
                                                </div>
                                            </ModalBody>

                                            {/* Footer */}
                                            <ModalFooter className="px-8 py-6 bg-gray-50 border-t border-gray-200">
                                                <div className="flex gap-3 w-full justify-end">
                                                    <Button
                                                        variant="light"
                                                        onPress={onClose}
                                                        className="px-6 py-2.5 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200 font-medium border border-gray-200"
                                                    >
                                                        取消
                                                    </Button>
                                                    <Button
                                                        onPress={
                                                            createKnowledgeBase
                                                        }
                                                        isDisabled={
                                                            !newKbName.trim()
                                                        }
                                                        className={`
                                                            px-8 py-2.5 rounded-xl font-semibold shadow-lg
                                                            transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]
                                                            ${
                                                                !newKbName.trim()
                                                                    ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                                                                    : "bg-gray-900 text-white hover:bg-black hover:shadow-xl shadow-gray-900/20"
                                                            }
                                                        `}
                                                        startContent={
                                                            newKbName.trim() ? (
                                                                <Plus className="h-4 w-4" />
                                                            ) : (
                                                                <svg
                                                                    className="h-4 w-4"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={
                                                                            2
                                                                        }
                                                                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                                                    />
                                                                </svg>
                                                            )
                                                        }
                                                    >
                                                        创建知识库
                                                    </Button>
                                                </div>
                                            </ModalFooter>
                                        </>
                                    )}
                                </ModalContent>
                            </Modal>

                            <Button
                                onPress={() => setIsCreateDialogOpen(true)}
                                className="group w-full relative overflow-hidden rounded-xl shadow-lg bg-gray-900 text-white hover:bg-black hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                                startContent={
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-gray-700/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                        <Plus className="h-5 w-5 relative transform group-hover:scale-110 group-hover:rotate-90 transition-all duration-300" />
                                    </div>
                                }
                            >
                                <span className="relative font-semibold text-base">
                                    创建知识库
                                </span>
                            </Button>

                            <div className="space-y-2">
                                {knowledgeBases.map((kb) => (
                                    <Card
                                        key={kb.id}
                                        onClick={() => setSelectedKbId(kb.id)}
                                        className={`transition-all duration-200 rounded-xl shadow-sm hover:shadow-md cursor-pointer ${
                                            selectedKbId === kb.id
                                                ? "border-2 border-blue-600 bg-blue-50 shadow-md"
                                                : "border border-slate-200 hover:border-blue-300"
                                        }`}
                                    >
                                        <CardHeader className="pb-3">
                                            <div className="flex items-start justify-between w-full">
                                                <div className="flex-1">
                                                    <h3
                                                        className={`text-base font-semibold ${selectedKbId === kb.id ? "text-blue-800" : "text-slate-800"}`}
                                                    >
                                                        {kb.name}
                                                    </h3>
                                                    <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                                                        <FileText className="h-3 w-3" />
                                                        {kb.doc_count} 个文档
                                                    </p>
                                                </div>
                                                <Button
                                                    isIconOnly
                                                    variant="light"
                                                    size="sm"
                                                    className="h-8 w-8 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all duration-200"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteKnowledgeBase(
                                                            kb.id,
                                                        );
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardHeader>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 主内容区 - 文档列表 */}
                <div className="flex-1 flex flex-col bg-white">
                    <div className="flex-1 overflow-y-auto p-6">
                        {selectedKbId ? (
                            <div className="space-y-6">
                                <Card className="rounded-2xl shadow-md border border-slate-200">
                                    <CardBody>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h2 className="text-2xl font-bold text-blue-700">
                                                    {
                                                        knowledgeBases.find(
                                                            (kb) =>
                                                                kb.id ===
                                                                selectedKbId,
                                                        )?.name
                                                    }
                                                </h2>
                                                <p className="text-slate-600 mt-2 flex items-center gap-2">
                                                    <FileText className="h-4 w-4" />
                                                    {knowledgeBases.find(
                                                        (kb) =>
                                                            kb.id ===
                                                            selectedKbId,
                                                    )?.description ||
                                                        "暂无描述"}
                                                </p>
                                            </div>
                                            <label>
                                                <Button
                                                    as="span"
                                                    className="bg-blue-700 text-white hover:bg-blue-800 shadow-md rounded-xl transition-all duration-200 hover:shadow-lg"
                                                    startContent={
                                                        <Upload className="h-4 w-4" />
                                                    }
                                                >
                                                    上传文档
                                                </Button>
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept=".pdf,.docx,.txt,.doc"
                                                    onChange={(e) => {
                                                        const file =
                                                            e.target.files?.[0];
                                                        if (file) {
                                                            uploadDocument(
                                                                file,
                                                                selectedKbId,
                                                            );
                                                            // 清空input，允许重复上传同一文件
                                                            e.target.value = "";
                                                        }
                                                    }}
                                                />
                                            </label>
                                        </div>
                                    </CardBody>
                                </Card>

                                <Divider />

                                <div className="space-y-3">
                                    {documents.length === 0 ? (
                                        <Card className="border-2 border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-white rounded-2xl">
                                            <CardBody className="p-12 text-center">
                                                <div className="p-4 rounded-full bg-gradient-to-br from-blue-200 to-blue-300 w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-sm">
                                                    <FileText className="h-8 w-8 text-blue-700" />
                                                </div>
                                                <p className="text-slate-600 font-medium">
                                                    暂无文档，请上传文档
                                                </p>
                                            </CardBody>
                                        </Card>
                                    ) : (
                                        <>
                                            {getPaginatedDocuments().map(
                                                (doc) => (
                                                    <Card
                                                        key={doc.id}
                                                        className="hover:shadow-md transition-all duration-200 rounded-xl border border-slate-200"
                                                    >
                                                        <CardHeader>
                                                            <div className="flex items-start justify-between w-full">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <div className="p-1.5 rounded-xl bg-gradient-to-br from-blue-100 to-blue-200 shadow-sm">
                                                                            <FileText className="h-5 w-5 text-blue-700" />
                                                                        </div>
                                                                        <h3 className="text-lg text-slate-800 font-semibold">
                                                                            {
                                                                                doc.name
                                                                            }
                                                                        </h3>
                                                                    </div>
                                                                    <div className="flex items-center gap-4 text-sm text-slate-600 ml-9">
                                                                        <Chip
                                                                            size="sm"
                                                                            variant="flat"
                                                                        >
                                                                            {
                                                                                doc.file_type
                                                                            }
                                                                        </Chip>
                                                                        <span>
                                                                            {(
                                                                                doc.file_size /
                                                                                1024
                                                                            ).toFixed(
                                                                                2,
                                                                            )}{" "}
                                                                            KB
                                                                        </span>
                                                                        <span>
                                                                            {
                                                                                doc.chunk_count
                                                                            }{" "}
                                                                            个分块
                                                                        </span>
                                                                        {getStatusBadge(
                                                                            doc.status,
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    {doc.status ===
                                                                        "pending" && (
                                                                        <Button
                                                                            size="sm"
                                                                            onPress={() =>
                                                                                startParseDocument(
                                                                                    doc.id,
                                                                                )
                                                                            }
                                                                            isLoading={
                                                                                parsingDocId ===
                                                                                doc.id
                                                                            }
                                                                            className="bg-blue-600 text-white hover:bg-blue-700 rounded-xl transition-all duration-200 disabled:opacity-50"
                                                                            startContent={
                                                                                parsingDocId ===
                                                                                doc.id ? (
                                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                                ) : null
                                                                            }
                                                                        >
                                                                            {parsingDocId ===
                                                                            doc.id
                                                                                ? "解析中..."
                                                                                : "开始解析"}
                                                                        </Button>
                                                                    )}
                                                                    {doc.status ===
                                                                        "failed" && (
                                                                        <Button
                                                                            size="sm"
                                                                            onPress={() =>
                                                                                startParseDocument(
                                                                                    doc.id,
                                                                                )
                                                                            }
                                                                            isLoading={
                                                                                parsingDocId ===
                                                                                doc.id
                                                                            }
                                                                            className="bg-orange-600 text-white hover:bg-orange-700 rounded-xl transition-all duration-200 disabled:opacity-50"
                                                                            startContent={
                                                                                parsingDocId ===
                                                                                doc.id ? (
                                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                                ) : null
                                                                            }
                                                                        >
                                                                            {parsingDocId ===
                                                                            doc.id
                                                                                ? "解析中..."
                                                                                : "重新解析"}
                                                                        </Button>
                                                                    )}
                                                                    {doc.status ===
                                                                        "completed" && (
                                                                        <Button
                                                                            size="sm"
                                                                            onPress={() =>
                                                                                reparseDocument(
                                                                                    doc.id,
                                                                                )
                                                                            }
                                                                            isLoading={
                                                                                parsingDocId ===
                                                                                doc.id
                                                                            }
                                                                            className="bg-green-600 text-white hover:bg-green-700 rounded-xl transition-all duration-200 disabled:opacity-50"
                                                                            startContent={
                                                                                parsingDocId ===
                                                                                doc.id ? (
                                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                                ) : null
                                                                            }
                                                                        >
                                                                            {parsingDocId ===
                                                                            doc.id
                                                                                ? "重新解析中..."
                                                                                : "重新解析"}
                                                                        </Button>
                                                                    )}
                                                                    {doc.status ===
                                                                        "processing" && (
                                                                        <div className="flex items-center gap-2 text-sm text-blue-700 px-3 py-1.5 rounded-xl bg-blue-100">
                                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                                            <span>
                                                                                解析中...
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                    <Button
                                                                        isIconOnly
                                                                        variant="light"
                                                                        size="sm"
                                                                        className="hover:bg-red-50 hover:text-red-600 transition-all duration-200 rounded-xl"
                                                                        onPress={() =>
                                                                            deleteDocument(
                                                                                doc.id,
                                                                            )
                                                                        }
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </CardHeader>
                                                    </Card>
                                                ),
                                            )}
                                            {totalPages > 1 && (
                                                <Card className="rounded-xl border border-slate-200 shadow-sm mt-4">
                                                    <Pagination
                                                        currentPage={
                                                            currentPage
                                                        }
                                                        totalPages={totalPages}
                                                        onPageChange={
                                                            setCurrentPage
                                                        }
                                                        pageSize={pageSize}
                                                        total={documents.length}
                                                    />
                                                </Card>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <Card className="border-2 border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-white rounded-2xl">
                                <CardBody className="p-12 text-center">
                                    <div className="p-4 rounded-full bg-gradient-to-br from-indigo-200 to-indigo-300 w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-sm">
                                        <BookOpen className="h-8 w-8 text-indigo-700" />
                                    </div>
                                    <p className="text-slate-600 font-medium">
                                        请先选择一个知识库
                                    </p>
                                </CardBody>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
