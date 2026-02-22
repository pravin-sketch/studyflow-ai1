import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload as UploadIcon } from "lucide-react";
import { insertStudyMaterial, getStudyMaterials } from "@/lib/queries";

const Upload = () => {
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const [materials, setMaterials] = useState(getStudyMaterials() || []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      for (const file of Array.from(files)) {
        const allowedTypes = ['application/pdf', 'text/plain', 'application/msword', 
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        
        if (!allowedTypes.includes(file.type)) {
          toast({
            title: "Invalid file type",
            description: `${file.name} is not a supported format. Please upload PDF, TXT, DOC, or DOC files.`,
            variant: "destructive",
          });
          continue;
        }

        const arrayBuffer = await file.arrayBuffer();
        const fileData = new Uint8Array(arrayBuffer);
        const materialId = insertStudyMaterial(file.name, file.type, file.size, fileData);

        toast({
          title: "Success",
          description: `${file.name} uploaded successfully`,
        });
      }
      setMaterials(getStudyMaterials());
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 bg-background flex items-center justify-center">
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Upload Study Materials
          </h1>
          <p className="text-muted-foreground">
            Share your textbooks, notes, PDFs, or course materials to get started
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Upload Files</CardTitle>
            <CardDescription>
              Supported formats: PDF, TXT, DOC, DOCX (AI generation works for PDF and TXT)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadIcon className="w-12 h-12 mb-3 text-muted-foreground" />
                <p className="mb-2 text-sm">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">
                  PDF, TXT, DOC, or DOCX
                </p>
              </div>
              <input
                type="file"
                className="hidden"
                multiple
                accept=".pdf,.txt,.doc,.docx"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </label>
            {uploading && (
              <p className="mt-4 text-center text-sm text-muted-foreground">
                Uploading...
              </p>
            )}
          </CardContent>
        </Card>

        {materials && materials.length > 0 && (
          <Button onClick={() => navigate(`/question-chat?materialId=${materials[materials.length - 1].id}`)} className="w-full">
            Let's study with AI
          </Button>
        )}
      </div>
    </div>
  );
};

export default Upload;