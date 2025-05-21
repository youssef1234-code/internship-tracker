import { useState } from "react";
import { Button } from "../ui/button.tsx";
import { Form, FormControl, FormField, FormItem, FormLabel } from "../ui/form.tsx";
import { useForm } from "react-hook-form";
import { Textarea } from "../ui/textarea.tsx";
import { Input } from "../ui/input.tsx";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../ui/card.tsx";
import { Upload } from "lucide-react";
import { toast } from "sonner";

const StudentApplicationForm = ({ internship, onSubmit }) => {
  const [files, setFiles] = useState([]);
  const form = useForm();

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles([...files, ...newFiles]);
  };

  const handleRemoveFile = (index) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  const handleSubmit = (data) => {
    const formData = new FormData();
    
    // Append form data
    formData.append("coverLetter", data.coverLetter);
    formData.append("additionalInfo", data.additionalInfo);
    
    // Append files
    files.forEach((file) => {
      formData.append("documents", file);
    });

    onSubmit(formData);
    toast({
      title: "Application Submitted",
      description: "Your application has been submitted successfully!",
    });
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Apply for {internship?.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              name="coverLetter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cover Letter</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Write your cover letter here..." 
                      className="min-h-40"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              name="additionalInfo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Information</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any additional information you'd like to share..." 
                      className="min-h-24"
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormItem>
              <FormLabel>Upload Documents</FormLabel>
              <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors">
                <Input 
                  type="file" 
                  className="hidden" 
                  id="file-upload" 
                  multiple 
                  onChange={handleFileChange}
                />
                <label htmlFor="file-upload" className="flex flex-col items-center cursor-pointer">
                  <Upload className="mb-2 text-gray-500" />
                  <span className="text-sm text-gray-500">
                    Upload certificates, CV, or any other supporting documents
                  </span>
                </label>
              </div>
              
              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium">Uploaded Files</p>
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                      <span className="text-sm truncate max-w-xs">{file.name}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleRemoveFile(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </FormItem>
            
            <CardFooter className="px-0 flex justify-end">
              <Button type="submit">Submit Application</Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default StudentApplicationForm;
