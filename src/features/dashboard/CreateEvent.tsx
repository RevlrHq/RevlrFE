'use client';

import { SetStateAction, useState } from 'react';
import { GreaterIcon, CameraIcon, AddIcon } from '@src/icons';
import { Calendar, Clock } from 'lucide-react';
import { Input } from '@components/ui/input';
import { Textarea } from '@components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui/tabs';
import { Label } from '@components/ui/label';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@components/ui/card';
import { Button } from '@components/ui/button';
import { RadioGroup, RadioGroupItem } from '@components/ui/radio-group';
import { Form, FormControl, FormField, FormItem } from '@components/ui/form';
import { Switch } from '@components/ui/switch';
import { useForm } from 'react-hook-form';
import EventModal from './components/EventModal';

interface EventFormValues {
    eventName: string;
    eventDescription: string;
    eventCategory: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    organizerName: string;
    organizerWebsite: string;
    facebook: string;
    instagram: string;
    twitter: string;
    venueName: string;
    venueAddress: string;
    googleMapsLink: string;
    eventLink: string;
    ticketType: string;
    ticketName: string;
    ticketPrice: string;
    ticketQuantity: string;
    purchaseLimit: string;
    ticketDescription: string;
    refundPolicy: string;
    feeOption: string;
    salesStartDate: string;
    salesStartTime: string;
    salesEndDate: string;
    salesEndTime: string;
}

const CreateEvent = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [location, setLocation] = useState('in-person');
    const [images, setImages] = useState<string[]>([
        'image1',
        'image2',
        'image3',
    ]);
    const [ticketType, setTicketType] = useState('free');
    const [tickets, setTickets] = useState([
        {
            id: 1,
            name: 'General Admission',
            price: 'Free',
            quantity: 500,
            salesStartDate: '17/2/2025',
            salesStartTime: '8:00 AM',
            salesEndDate: '20/3/2025',
            salesEndTime: '11:59 PM',
            purchaseLimit: 3,
            selected: false,
        },
        {
            id: 2,
            name: 'VIP',
            price: '$80',
            quantity: 100,
            salesStartDate: '17/2/2025',
            salesStartTime: '8:00 AM',
            salesEndDate: '20/3/2025',
            salesEndTime: '11:59 PM',
            purchaseLimit: 2,
            selected: true,
        },
    ]);
    const eventData = {
        title: 'Samba Music Festival 2025',
        date: '23rd Monday, Apr 8, 2025',
        time: '6:00 PM - 11:30 PM',
        location: 'Central Park, 1st Avenue Road, Echo City',
        image: '/samba-festival.jpg',
    };
    const [modalOpen, setModalOpen] = useState(false);
    const [feeOption, setFeeOption] = useState('attendees');

    const form = useForm<EventFormValues>({
        defaultValues: {
            eventName: '',
            eventDescription: '',
            eventCategory: '',
            startDate: '',
            endDate: '',
            startTime: '',
            endTime: '',
            // timezone: "",

            organizerName: '',
            organizerWebsite: '',

            facebook: '',
            instagram: '',
            twitter: '',

            venueName: '',
            venueAddress: '',
            googleMapsLink: '',
            eventLink: '',

            ticketName: '',
            ticketPrice: '',
            ticketQuantity: '',
            purchaseLimit: '',
            salesStartDate: '',
            salesStartTime: '',
            salesEndDate: '',
            salesEndTime: '',
            ticketDescription: '',
            refundPolicy: '',
            feeOption: '',
        },
    });

    const handleTicketTypeChange = (type: string) => {
        setTicketType(type);
    };

    const addTicket = () => {
        alert('Ticket added successfully!');
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const fileArray = Array.from(e.target.files);
            setImages((prevImages) =>
                [...prevImages, ...fileArray.map((file) => file.name)].slice(
                    0,
                    3
                )
            );
        }
    };

    const onSubmit = (values: EventFormValues) => {
        console.log(values);
        //setModalOpen(true);
    };

    const handleLocationSelect = (value: SetStateAction<string>) => {
        setLocation(value);
    };

    const goToNextStep = () => {
        console.log('Form Values', form.getValues());
        setCurrentStep(currentStep + 1);
    };

    const goToPreviousStep = () => {
        setCurrentStep(currentStep - 1);
    };

    return (
        <div>
            <div className='border-b border-gray-200 bg-white px-4'>
                <div className='flex items-center justify-between bg-white p-4'>
                    <div className='flex items-center space-x-2 text-sm'>
                        <span
                            className={`cursor-pointer font-inter text-sm font-medium text-[#0066FF] ${currentStep === 1 ? 'font-semibold' : 'text-gray-500'}`}
                            onClick={() => setCurrentStep(1)}
                        >
                            Event Details
                        </span>
                        <span className='text-gray-300'>
                            <GreaterIcon />
                        </span>
                        <span
                            className={`cursor-pointer font-inter text-sm font-medium text-[#9DA4B0] ${currentStep === 2 ? 'font-semibold text-blue-600' : 'text-gray-500'}`}
                            onClick={() => setCurrentStep(2)}
                        >
                            Tickets
                        </span>
                    </div>

                    {currentStep === 1 ? (
                        <Button
                            onClick={() => setModalOpen(true)}
                            className='bg-blue-500 font-inter text-sm font-normal text-white hover:bg-blue-600 focus:opacity-50 focus:ring-2 focus:ring-blue-500'
                        >
                            Continue
                        </Button>
                    ) : (
                        <Button
                            onClick={() => setModalOpen(true)}
                            className='bg-blue-500 font-inter text-sm font-normal text-white hover:bg-blue-600 focus:opacity-50 focus:ring-2 focus:ring-blue-500'
                        >
                            Publish
                        </Button>
                    )}
                </div>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className='w-full'>
                    <Tabs value={`step-${currentStep}`} className='w-full'>
                        <TabsContent value='step-1' className='w-full'>
                            <div className='m-8 flex flex-row gap-8'>
                                <div className='flex flex-1 flex-col gap-8'>
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className='text-sm font-medium text-[#001433]'>
                                                <span className='mr-1 text-[#D97708]'>
                                                    *
                                                </span>
                                                Images
                                            </CardTitle>
                                            <CardDescription className='font-inter text-sm font-normal text-[#374252]'>
                                                Add at least 1 image for your
                                                event
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className='flex flex-col space-y-8'>
                                                <div className='flex size-[414px] flex-col items-center justify-center border border-[#F2F3F5] bg-[#F7F8FA] transition hover:border-blue-500'>
                                                    <input
                                                        type='file'
                                                        accept='image/*'
                                                        multiple
                                                        className='hidden'
                                                        id='image-upload'
                                                        onChange={
                                                            handleImageUpload
                                                        }
                                                    />
                                                    <label
                                                        htmlFor='image-upload'
                                                        className='flex cursor-pointer flex-col items-center'
                                                    >
                                                        <CameraIcon />
                                                        <span className='text-sm text-[#374252]'>
                                                            Add Event Image
                                                        </span>
                                                    </label>
                                                </div>

                                                <div className='flex flex-row gap-8'>
                                                    {images.map(
                                                        (image, index) => (
                                                            <div
                                                                key={index}
                                                                className='relative size-32 border border-[#F2F3F5] bg-[#F7F8FA]'
                                                            >
                                                                <div className='absolute inset-0 flex items-center justify-center'>
                                                                    <span className='p-2 text-center text-xs text-gray-500'>
                                                                        {image}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )
                                                    )}
                                                    <div className='flex size-32 items-center justify-center border border-[#F2F3F5] bg-[#F7F8FA]'>
                                                        <input
                                                            type='file'
                                                            accept='image/*'
                                                            multiple
                                                            className='hidden'
                                                            id='additional-image'
                                                            onChange={
                                                                handleImageUpload
                                                            }
                                                        />
                                                        <label
                                                            htmlFor='additional-image'
                                                            className='flex size-full cursor-pointer flex-col items-center justify-center'
                                                        >
                                                            <AddIcon />
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className='bg-white p-8 shadow-md'>
                                        <CardHeader>
                                            <CardTitle className='font-inter text-sm font-medium'>
                                                Organizer Details
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className='space-y-4'>
                                            <div className='flex flex-row items-center gap-4'>
                                                <Button
                                                    variant='outline'
                                                    className='size-12 rounded-full p-0'
                                                >
                                                    <AddIcon />
                                                </Button>
                                                <span className='font-inter text-sm font-normal'>
                                                    Add Logo
                                                </span>
                                            </div>

                                            <FormField
                                                control={form.control}
                                                name='organizerName'
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormControl>
                                                            <Input
                                                                placeholder='Organizer Name'
                                                                className='font-inter text-sm font-normal text-[#4C5563]'
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name='organizerWebsite'
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormControl>
                                                            <Input
                                                                placeholder='Organizer Website'
                                                                className='font-inter text-sm font-normal text-[#4C5563]'
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle className='font-inter text-sm font-medium text-[#001433]'>
                                                Socials
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className='space-y-4'>
                                            <FormField
                                                control={form.control}
                                                name='facebook'
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormControl>
                                                            <Input
                                                                placeholder='Facebook'
                                                                className='font-inter text-sm font-normal text-[#4C5563]'
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name='instagram'
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormControl>
                                                            <Input
                                                                placeholder='Instagram'
                                                                className='font-inter text-sm font-normal text-[#4C5563]'
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name='twitter'
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormControl>
                                                            <Input
                                                                placeholder='X (Twitter)'
                                                                className='font-inter text-sm font-normal text-[#4C5563]'
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        </CardContent>
                                    </Card>
                                </div>

                                <div className='flex flex-1 flex-col gap-8'>
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className='font-inter text-sm font-medium text-[#001433]'>
                                                <span className='mr-1 text-[#D97708]'>
                                                    *
                                                </span>
                                                Basic Details
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className='space-y-4'>
                                            <FormField
                                                control={form.control}
                                                name='eventName'
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormControl>
                                                            <Input
                                                                placeholder='Event Name'
                                                                className='font-inter text-sm font-normal text-[#4C5563]'
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name='eventDescription'
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormControl>
                                                            <Textarea
                                                                placeholder='Event Description'
                                                                rows={5}
                                                                className='font-inter text-sm font-normal'
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name='eventCategory'
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <Select
                                                            onValueChange={
                                                                field.onChange
                                                            }
                                                            defaultValue={
                                                                field.value
                                                            }
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger className='w-full border border-[#E4E6EB] px-4 py-6 font-inter text-sm text-[#4C5563] focus:outline-none'>
                                                                    <SelectValue placeholder='Event Category' />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value='conference'>
                                                                    Conference
                                                                </SelectItem>
                                                                <SelectItem value='workshop'>
                                                                    Workshop
                                                                </SelectItem>
                                                                <SelectItem value='meetup'>
                                                                    Meetup
                                                                </SelectItem>
                                                                <SelectItem value='webinar'>
                                                                    Webinar
                                                                </SelectItem>
                                                                <SelectItem value='other'>
                                                                    Other
                                                                </SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </FormItem>
                                                )}
                                            />
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle className='font-inter text-sm font-medium text-[#001433]'>
                                                <span className='mr-1 text-[#D97708]'>
                                                    *
                                                </span>
                                                Date & Time
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className='space-y-4'>
                                            <div className='flex items-center rounded-lg border border-[#E4E6EB] p-4 text-sm text-[#4C5563]'>
                                                <Calendar
                                                    size={18}
                                                    className='mr-2 text-gray-500'
                                                />
                                                {/* <FormField
                        control={form.control}
                        name="eventDates"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input 
                                placeholder="Start Date → End Date" 
                                className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                                {...field} 
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      /> */}
                                            </div>

                                            <div className='flex items-center justify-between rounded-lg border border-[#E4E6EB] p-4 text-sm text-[#4C5563]'>
                                                <div className='flex items-center'>
                                                    <Clock
                                                        size={18}
                                                        className='mr-2 text-gray-500'
                                                    />
                                                    <span className='text-gray-500'>
                                                        Start Time → End Time
                                                    </span>
                                                </div>
                                                <svg
                                                    width='16'
                                                    height='16'
                                                    viewBox='0 0 16 16'
                                                    fill='none'
                                                    xmlns='http://www.w3.org/2000/svg'
                                                >
                                                    <path
                                                        d='M8 10L12 6H4L8 10Z'
                                                        fill='#374252'
                                                    />
                                                </svg>
                                            </div>

                                            <div className='flex items-center justify-between rounded-lg border border-[#E4E6EB] p-4 text-sm text-[#4C5563]'>
                                                <span className='text-gray-500'>
                                                    Time Zone
                                                </span>
                                                <svg
                                                    width='16'
                                                    height='16'
                                                    viewBox='0 0 16 16'
                                                    fill='none'
                                                    xmlns='http://www.w3.org/2000/svg'
                                                >
                                                    <path
                                                        d='M8 10L12 6H4L8 10Z'
                                                        fill='#374252'
                                                    />
                                                </svg>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle className='font-inter text-sm font-medium text-[#001433]'>
                                                <span className='mr-1 text-[#D97708]'>
                                                    *
                                                </span>
                                                Location
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <Tabs
                                                defaultValue='in-person'
                                                onValueChange={
                                                    handleLocationSelect
                                                }
                                                value={location}
                                            >
                                                <TabsList className='mb-4 grid w-full grid-cols-3 border-b bg-transparent p-0'>
                                                    <TabsTrigger
                                                        value='in-person'
                                                        className='rounded-none pb-3 data-[state=active]:border-b-2 data-[state=active]:border-[#0066FF] data-[state=active]:text-[#0066FF]'
                                                    >
                                                        In-Person
                                                    </TabsTrigger>
                                                    <TabsTrigger
                                                        value='virtual'
                                                        className='rounded-none pb-3 data-[state=active]:border-b-2 data-[state=active]:border-[#0066FF] data-[state=active]:text-[#0066FF]'
                                                    >
                                                        Virtual
                                                    </TabsTrigger>
                                                    <TabsTrigger
                                                        value='hybrid'
                                                        className='rounded-none pb-3 data-[state=active]:border-b-2 data-[state=active]:border-[#0066FF] data-[state=active]:text-[#0066FF]'
                                                    >
                                                        Hybrid
                                                    </TabsTrigger>
                                                </TabsList>

                                                <TabsContent
                                                    value='in-person'
                                                    className='space-y-3'
                                                >
                                                    <FormField
                                                        control={form.control}
                                                        name='venueName'
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Input
                                                                        placeholder='Venue Name'
                                                                        className='font-inter text-sm font-normal text-[#4C5563]'
                                                                        {...field}
                                                                    />
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name='venueAddress'
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Input
                                                                        placeholder='Address'
                                                                        className='font-inter text-sm font-normal text-[#4C5563]'
                                                                        {...field}
                                                                    />
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name='googleMapsLink'
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Input
                                                                        placeholder='Google Maps Link'
                                                                        className='font-inter text-sm font-normal text-[#4C5563]'
                                                                        {...field}
                                                                    />
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />
                                                </TabsContent>

                                                <TabsContent value='virtual'>
                                                    <FormField
                                                        control={form.control}
                                                        name='eventLink'
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Input
                                                                        placeholder='Event Link'
                                                                        className='font-inter text-sm font-normal text-[#4C5563]'
                                                                        {...field}
                                                                    />
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />
                                                </TabsContent>

                                                <TabsContent
                                                    value='hybrid'
                                                    className='space-y-3'
                                                >
                                                    <FormField
                                                        control={form.control}
                                                        name='venueName'
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Input
                                                                        placeholder='Venue Name'
                                                                        className='font-inter text-sm font-normal text-[#4C5563]'
                                                                        {...field}
                                                                    />
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name='venueAddress'
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Input
                                                                        placeholder='Address'
                                                                        className='font-inter text-sm font-normal text-[#4C5563]'
                                                                        {...field}
                                                                    />
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name='googleMapsLink'
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Input
                                                                        placeholder='Google Maps Link'
                                                                        className='font-inter text-sm font-normal text-[#4C5563]'
                                                                        {...field}
                                                                    />
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name='eventLink'
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Input
                                                                        placeholder='Event Link'
                                                                        className='font-inter text-sm font-normal text-[#4C5563]'
                                                                        {...field}
                                                                    />
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />
                                                </TabsContent>
                                            </Tabs>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                            <div className='flex justify-end p-8'>
                                <Button
                                    type='button'
                                    onClick={goToNextStep}
                                    className='bg-[#0066FF] text-white hover:bg-blue-600'
                                >
                                    Next: Tickets
                                </Button>
                            </div>
                        </TabsContent>

                        <TabsContent value='step-2' className='w-full'>
                            <div className='space-y-6 p-8'>
                                <Card>
                                    <CardContent className='flex flex-row gap-12 p-6'>
                                        <div className='mb-6'>
                                            <h2 className='mb-4 font-inter text-sm font-medium text-[#001433]'>
                                                Ticket Types
                                            </h2>
                                            <RadioGroup
                                                value={ticketType}
                                                onValueChange={
                                                    handleTicketTypeChange
                                                }
                                                className='flex flex-col space-y-4'
                                            >
                                                <div className='flex items-center space-x-2'>
                                                    <RadioGroupItem
                                                        value='free'
                                                        id='free'
                                                        className='size-5'
                                                    />
                                                    <Label
                                                        htmlFor='free'
                                                        className={`text-sm ${ticketType === 'free' ? 'font-medium text-[#0066FF]' : 'font-normal text-[#374252]'}`}
                                                    >
                                                        Free
                                                    </Label>
                                                </div>

                                                <div className='flex items-center space-x-2'>
                                                    <RadioGroupItem
                                                        value='paid'
                                                        id='paid'
                                                        className='size-5'
                                                    />
                                                    <Label
                                                        htmlFor='paid'
                                                        className={`text-sm ${ticketType === 'paid' ? 'font-medium text-[#0066FF]' : 'font-normal text-[#374252]'}`}
                                                    >
                                                        Paid
                                                    </Label>
                                                </div>
                                            </RadioGroup>
                                        </div>

                                        <div className='flex-1'>
                                            <h2 className='mb-4 text-sm font-medium text-[#001433]'>
                                                <span className='text-orange-500'>
                                                    *
                                                </span>{' '}
                                                Ticket Details
                                            </h2>

                                            <div className='mb-4 grid grid-cols-1 gap-4 md:grid-cols-3'>
                                                <FormField
                                                    control={form.control}
                                                    name='ticketName'
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <Input
                                                                    placeholder='Ticket Name'
                                                                    className='font-inter text-sm font-normal'
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />

                                                {ticketType === 'paid' && (
                                                    <FormField
                                                        control={form.control}
                                                        name='ticketPrice'
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Input
                                                                        placeholder='Ticket Price'
                                                                        className='font-inter text-sm font-normal'
                                                                        {...field}
                                                                    />
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />
                                                )}

                                                <FormField
                                                    control={form.control}
                                                    name='ticketQuantity'
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <Input
                                                                    placeholder='Ticket Quantity'
                                                                    className='font-inter text-sm font-normal'
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name='purchaseLimit'
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormControl>
                                                                <Input
                                                                    placeholder='Purchase Limit'
                                                                    className='font-inter text-sm font-normal'
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <div className='mb-4 grid grid-cols-1 gap-4 md:grid-cols-2'>
                                                <div className='flex items-center justify-between rounded-lg border border-[#E4E6EB] p-4 text-sm text-[#4C5563]'>
                                                    <span>
                                                        Sales Start → End Date
                                                    </span>
                                                    <Calendar className='size-5 text-gray-500' />
                                                </div>

                                                <div className='flex items-center justify-between rounded-lg border border-[#E4E6EB] p-4 text-sm text-[#4C5563]'>
                                                    <span>
                                                        Sales Start → End Time
                                                    </span>
                                                    <Clock className='size-5 text-gray-500' />
                                                </div>
                                            </div>

                                            {ticketType === 'paid' && (
                                                <>
                                                    <div className='mb-4 grid grid-cols-1 gap-4 md:grid-cols-2'>
                                                        <FormField
                                                            control={
                                                                form.control
                                                            }
                                                            name='ticketDescription'
                                                            render={({
                                                                field,
                                                            }) => (
                                                                <FormItem>
                                                                    <FormControl>
                                                                        <Textarea
                                                                            placeholder='Ticket Description'
                                                                            className='h-24 font-inter text-sm font-normal'
                                                                            {...field}
                                                                        />
                                                                    </FormControl>
                                                                </FormItem>
                                                            )}
                                                        />

                                                        <FormField
                                                            control={
                                                                form.control
                                                            }
                                                            name='refundPolicy'
                                                            render={({
                                                                field,
                                                            }) => (
                                                                <FormItem>
                                                                    <FormControl>
                                                                        <Textarea
                                                                            placeholder='Refund Policy'
                                                                            className='h-24 font-inter text-sm font-normal'
                                                                            {...field}
                                                                        />
                                                                    </FormControl>
                                                                </FormItem>
                                                            )}
                                                        />
                                                    </div>

                                                    <div className='mb-4'>
                                                        <h2 className='mb-2 font-inter text-sm font-medium text-[#001433]'>
                                                            <span className='text-orange-500'>
                                                                *
                                                            </span>{' '}
                                                            Fee Absorption
                                                            Choice
                                                        </h2>
                                                        <p className='mb-2 font-inter text-sm font-medium text-[#374252]'>
                                                            REVLR charges a 1%
                                                            fee per ticket sold.
                                                            You can add this fee
                                                            to the ticket price
                                                            (attendees pay) or
                                                            deduct it from your
                                                            earnings (you pay).
                                                        </p>

                                                        <div className='flex items-center space-x-4'>
                                                            <span
                                                                className={`font-inter text-sm ${feeOption === 'attendees' ? 'font-medium text-[#0066FF]' : 'font-normal text-[#374252]'}`}
                                                            >
                                                                Attendees Pay
                                                            </span>
                                                            <Switch
                                                                checked={
                                                                    feeOption !==
                                                                    'attendees'
                                                                }
                                                                onCheckedChange={() =>
                                                                    setFeeOption(
                                                                        feeOption ===
                                                                            'attendees'
                                                                            ? 'you'
                                                                            : 'attendees'
                                                                    )
                                                                }
                                                                className='data-[state=checked]:bg-[#0066FF]'
                                                            />
                                                            <span
                                                                className={`font-inter text-sm ${feeOption !== 'attendees' ? 'font-medium text-[#0066FF]' : 'font-normal text-[#374252]'}`}
                                                            >
                                                                I'll Pay
                                                            </span>
                                                        </div>
                                                    </div>
                                                </>
                                            )}

                                            <div className='flex justify-end'>
                                                <Button
                                                    type='button'
                                                    onClick={addTicket}
                                                    className='rounded-lg bg-[#0066FF] text-white hover:bg-blue-600'
                                                >
                                                    Add Ticket
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {tickets.length > 0 && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className='text-sm font-medium text-[#001433]'>
                                                Added Tickets
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className='space-y-4'>
                                                {tickets.map(
                                                    (ticket, index) => (
                                                        <div
                                                            key={index}
                                                            className='rounded-lg border border-[#E4E6EB] p-4'
                                                        >
                                                            <div className='flex justify-between'>
                                                                <div>
                                                                    <h3 className='font-medium'>
                                                                        {
                                                                            ticket.name
                                                                        }
                                                                    </h3>
                                                                    <p className='text-sm text-gray-500'>
                                                                        {ticket.price ===
                                                                        '0'
                                                                            ? 'Free'
                                                                            : `$${ticket.price}`}{' '}
                                                                        • Qty:{' '}
                                                                        {
                                                                            ticket.quantity
                                                                        }
                                                                    </p>
                                                                </div>
                                                                <div className='flex space-x-2'>
                                                                    <Button
                                                                        variant='outline'
                                                                        size='sm'
                                                                        className='h-8 px-2 text-xs'
                                                                        onClick={() => {
                                                                            const updatedTickets =
                                                                                [
                                                                                    ...tickets,
                                                                                ];
                                                                            updatedTickets.splice(
                                                                                index,
                                                                                1
                                                                            );
                                                                            setTickets(
                                                                                updatedTickets
                                                                            );
                                                                        }}
                                                                    >
                                                                        Remove
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                <div className='flex justify-between p-4'>
                                    <Button
                                        type='button'
                                        variant='outline'
                                        onClick={goToPreviousStep}
                                    >
                                        Back to Details
                                    </Button>
                                    <Button
                                        type='submit'
                                        className='bg-[#0066FF] text-white hover:bg-blue-600'
                                    >
                                        Create Event
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </form>
            </Form>

            <EventModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                event={eventData}
            />
        </div>
    );
};

export default CreateEvent;
