import { useState } from "react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card.tsx";
import { Input } from "../ui/input.tsx";
import { Button } from "../ui/button.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select.tsx";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import BackToHomePage from "../common/BackToHomePage";
import { getAllFromStore, saveToStore } from "../../utils/indexedDB-utils";
import { fileToBase64, filesToBase64 } from "../../utils/file-utils";

const saveToIndexedDB = (data) => saveToStore("companyProfiles", data);

const CompanyRegistrationForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const navigator = useNavigate();
  const [isDone, setIsDone] = useState(false);

  const form = useForm({
    defaultValues: {
      companyName: "",
      industry: "",
      companySize: "",
      email: "",
      logo: null,
      documents: null,
    },
  });

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const allCompanies = await getAllFromStore("companyProfiles");
      allCompanies.sort((a, b) => a.id - b.id);
      const newId =
        allCompanies.length > 0 ? allCompanies.slice(-1)[0].id + 1 : 1;

      // Process logo if provided
      let processedLogo = null;
      if (data.logo) {
        processedLogo = await fileToBase64(data.logo);
      }

      // Process documents if provided
      let processedDocuments = [];
      if (data.documents && data.documents.length > 0) {
        processedDocuments = await filesToBase64(data.documents);
      }

      const fullData = {
        id: newId,
        ...data,
        logo: processedLogo,
        documents: processedDocuments,
        status: "pending",
      };

      await saveToIndexedDB(fullData);
      setIsSubmitting(false);
      navigator("/login");
    } catch (error) {
      console.error("Error submitting form:", error);
      setIsSubmitting(false);
    }
  };

  const formComponent = (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Company Registration</CardTitle>
          <CardDescription>
            Register your company to the SCAD internship system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter company name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Technology">Technology</SelectItem>
                        <SelectItem value="Finance">Finance</SelectItem>
                        <SelectItem value="Healthcare">Healthcare</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="companySize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Size</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select company size" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="small">
                          Small (50 employees or less)
                        </SelectItem>
                        <SelectItem value="medium">
                          Medium (51-100 employees)
                        </SelectItem>
                        <SelectItem value="large">
                          Large (101-500 employees)
                        </SelectItem>
                        <SelectItem value="corporate">
                          Corporate (500+ employees)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Official Company Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="company@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      This email will be used for all communications from SCAD
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="logo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Logo</FormLabel>
                    <FormControl>
                      <div className="flex flex-col space-y-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            field.onChange(e.target.files[0]);
                            handleLogoChange(e);
                          }}
                        />
                        {logoPreview && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-500 mb-1">
                              Preview:
                            </p>
                            <img
                              src={logoPreview}
                              alt="Company logo preview"
                              className="w-24 h-24 object-contain border rounded"
                            />
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="documents"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Verification Documents</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => field.onChange(e.target.files)}
                      />
                    </FormControl>
                    <FormDescription>
                      Upload documents proving that you are a legitimate company
                      (such as tax documents)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Register Company"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );

  const doneComponent = <BackToHomePage />;

  return isDone ? doneComponent : formComponent;
};

export default CompanyRegistrationForm;

